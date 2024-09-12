import { nip19, SimplePool } from "nostr-tools";
import { binarySearch } from "nostr-tools/utils";

import {
  getFromCache,
  getOrInsertCache,
  insertToCache,
  saveLocalSettings,
} from "./local-cache.js";
import { Either } from "./utils.js";

export async function getUserPubkey({ settings, timeout = 1000 }) {
  if (settings.nostrSettings.mode === "nip07") {
    return new Promise((resolve) => {
      // TODO: remove async when we have a way to get pubkey from bunker
      window.addEventListener("message", async (event) => {
        if (event.source !== window) {
          return;
        }

        const { from, type, pubkey } = event.data;

        if (
          !(
            from === "nostrize-nip07-provider" &&
            type === "nip07-pubkey-request"
          )
        ) {
          return;
        }

        // save pubkey into settings
        // TODO: remove code when we have a way to get pubkey from bunker
        settings.nostrSettings.nip07.pubkey = pubkey;
        await saveLocalSettings({ settings });

        return resolve(pubkey);
      });

      window.postMessage({ type: "nip07-pubkey-request", from: "nostrize" });

      setTimeout(() => resolve(null), timeout);
    });
  } else {
    return null;
  }
}

export async function getPubkeyFrom({
  npub,
  nip05,
  pageUsername,
  cachePrefix,
}) {
  if (npub) {
    const { type, data } = nip19.decode(npub);

    if (type !== "npub") {
      throw new Error("nip19 error");
    }

    return data;
  }

  const cacheKey = `nostrize-nip05-${cachePrefix}-${pageUsername}`;

  const { pubkey } = await fetchNip05Data({ nip05, cacheKey });

  return pubkey;
}

export async function fetchNip05Data({ nip05, cacheKey }) {
  const { relays, pubkey } = await getOrInsertCache({
    key: cacheKey,
    insertCallback: () => {
      const [username, domain] = nip05.split("@");
      const fetchUrl = `https://${domain}/.well-known/nostr.json?user=${username}`;

      return Either.getOrElseThrow({
        eitherFn: () => fetchFromNip05({ user: username, fetchUrl }),
      });
    },
  });

  return { relays, pubkey };
}

export async function fetchFromNip05({ user, fetchUrl }) {
  try {
    const response = await fetch(fetchUrl);

    if (!response.ok) {
      return Either.left(
        `nip05 fetch response error with status: ${response.status}`,
      );
    }

    const json = await response.json();
    const pubkey = json["names"][user];

    if (!pubkey) {
      return Either.left(
        `could not find pubkey for user ${user} in nostr.json`,
      );
    }

    const nip46 = json["nip46"];
    const relays = nip46 ? nip46[pubkey] || [] : [];

    const extensions = json["nostrize-extension"];
    const extension = extensions ? extensions[pubkey] : undefined;

    return Either.right({ pubkey, relays, extension });
  } catch (error) {
    return Either.left(`nip05 fetch error ${error}`);
  }
}

export async function getMetadataEvent({ cacheKey, filter, relays }) {
  return getOrInsertCache({
    key: `nostrize-kind0-${cacheKey}`,
    insertCallback: () => {
      const pool = new SimplePool();

      return pool.get(relays, filter);
    },
  });
}

const getFollowSetCacheKey = (pubkey) => `nostrize-follow-list-${pubkey}`;

const getFollowSetFromCache = (pubkey) => {
  const cache = getFromCache(getFollowSetCacheKey(pubkey));

  if (!cache) {
    return null;
  }

  return {
    followSet: new Set(cache.followSet),
    latestEvent: cache.latestEvent,
  };
};

const setFollowSetToCache = (pubkey, latestEvent, followSet) =>
  insertToCache(getFollowSetCacheKey(pubkey), {
    latestEvent,
    followSet: [...followSet],
  });

function toFollowSet(event) {
  return new Set(
    // tag example: ["p", "91cf9..4e5ca", "wss://alicerelay.com/", "alice"]
    event.tags.reduce((acc, tag) => {
      if (tag[0] === "p") {
        acc.push(tag[1]);
      }

      return acc;
    }, []),
  );
}

export function getFollowSet({ pubkey, relays, callback, timeout }) {
  const cache = getFollowSetFromCache(pubkey);

  let since;

  if (cache) {
    callback(cache);

    since = cache.latestEvent.created_at;
  }

  const pool = new SimplePool();

  const subscription = pool.subscribeMany(
    relays,
    [
      {
        kinds: [3],
        authors: [pubkey],
        limit: 1,
        since,
      },
    ],
    {
      maxWait: timeout,
      onevent(event) {
        if (!since || event.created_at > since) {
          const followSet = toFollowSet(event);

          setFollowSetToCache(pubkey, event, followSet);

          callback({ latestEvent: event, followSet });
        }
      },
    },
  );

  return subscription;
}

async function updateFollowList({ pubkey, tags, relays, log }) {
  const eventTemplate = {
    kind: 3,
    pubkey,
    tags,
    content: "",
    created_at: Math.floor(Date.now() / 1000),
  };

  const signedEvent = await requestSigningFromNip07({
    type: "nip07-sign-request",
    from: "nostrize",
    eventTemplate,
  });

  const pool = new SimplePool();

  const res = await Promise.allSettled(pool.publish(relays, signedEvent));

  const publishedCount = res.filter((r) => r.status === "fulfilled").length;
  const publishFailedCount = res.filter((r) => r.status === "rejected").length;

  log(
    `update follow list: publishedCount: ${publishedCount}, publishFailedCount: ${publishFailedCount}`,
  );

  if (publishedCount === 0) {
    throw new Error("failed to publish event");
  }

  const followSet = toFollowSet(signedEvent);

  setFollowSetToCache(pubkey, signedEvent, followSet);

  log(`followSet: cache is updated`);

  return { followSet, latestEvent: signedEvent };
}

export async function followAccount({
  pubkey,
  pageUserPubkey,
  currentFollowEvent,
  relays,
  log,
}) {
  const tags = [...currentFollowEvent.tags, ["p", pageUserPubkey, relays[0]]];

  return updateFollowList({
    pubkey,
    tags,
    relays,
    log,
  });
}

export async function unfollowAccount({
  pubkey,
  pageUserPubkey,
  currentFollowEvent,
  relays,
  log,
}) {
  const tags = currentFollowEvent.tags.filter(
    (tag) => tag[1] !== pageUserPubkey,
  );

  return updateFollowList({
    pubkey,
    tags,
    relays,
    log,
  });
}

export async function requestSigningFromNip07(messageParams) {
  window.postMessage(messageParams);

  return new Promise((resolve) => {
    window.addEventListener("message", function (event) {
      if (event.source !== window) {
        return;
      }

      const { from, type, signedEvent } = event.data;

      if (
        !(
          from === "nostrize-nip07-provider" &&
          type === "nip07-sign-request" &&
          !!signedEvent
        )
      ) {
        return;
      }

      return resolve(signedEvent);
    });
  });
}

/**
 * @param {Array} sortedArray - The array to insert the event into
 * @param {Object} event - The event to insert
 * @returns {number} - The index where the event was inserted
 */
function insertEventIntoDescendingList(sortedArray, event) {
  const [idx, found] = binarySearch(sortedArray, (b) => {
    if (event.id === b.id) {
      return 0;
    }

    if (event.created_at === b.created_at) {
      return -1;
    }

    return b.created_at - event.created_at;
  });

  if (!found) {
    sortedArray.splice(idx, 0, event);
  }

  return idx;
}

const latestNotesCacheKey = (pubkey) => `nostrize-latest-notes-${pubkey}`;

export function fetchLatestNotes({ pubkey, relays, callback }) {
  const cacheKey = latestNotesCacheKey(pubkey);
  const cachedNotes = getFromCache(cacheKey) || [];

  const pool = new SimplePool();
  const notesSet = new Set(cachedNotes.map((note) => note.id));

  pool.subscribeMany(
    relays,
    [
      {
        kinds: [1],
        authors: [pubkey],
        limit: 100,
      },
    ],
    {
      onevent(event) {
        notesSet.add(event.id);

        const index = insertEventIntoDescendingList(cachedNotes, event);

        callback(event, index);
      },
      oneose() {
        console.log("eose, updating cache");

        insertToCache(cacheKey, cachedNotes);
      },
      alreadyHaveEvent(id) {
        return notesSet.has(id);
      },
    },
  );

  return cachedNotes;
}
