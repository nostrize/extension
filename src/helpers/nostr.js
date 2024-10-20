import { nip19, SimplePool } from "nostr-tools";
import { binarySearch } from "nostr-tools/utils";

import {
  getFromPageCache,
  getOrInsertPageCache,
  insertToPageCache,
} from "./local-cache.js";
import { Either } from "./either.ts";
import { getPubkeyFromNip07 } from "./nip07.js";

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
  const { relays, pubkey } = await getOrInsertPageCache({
    key: cacheKey,
    insertCallback: () => {
      const [username, domain] = nip05.split("@");
      const fetchUrl = `https://${domain}/.well-known/nostr.json?name=${username}`;

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
  return getOrInsertPageCache({
    key: `nostrize-kind0-${cacheKey}`,
    insertCallback: () => {
      const pool = new SimplePool();

      return pool.get(relays, filter);
    },
  });
}

const getFollowSetCacheKey = (pubkey) => `nostrize-follow-list-${pubkey}`;

const getFollowSetFromCache = (pubkey) => {
  const cache = getFromPageCache(getFollowSetCacheKey(pubkey));

  if (!cache) {
    return null;
  }

  return {
    followSet: new Set(cache.followSet),
    latestEvent: cache.latestEvent,
  };
};

const setFollowSetToCache = (pubkey, latestEvent, followSet) =>
  insertToPageCache(getFollowSetCacheKey(pubkey), {
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

  const { fulfilled, rejected } = await publishEvent({
    event: signedEvent,
    relays,
  });

  log(
    `update follow list: publishedCount: ${fulfilled.length}, publishFailedCount: ${rejected.length}`,
  );

  if (fulfilled.length === 0) {
    throw new Error("failed to publish event");
  }

  const followSet = toFollowSet(signedEvent);

  setFollowSetToCache(pubkey, signedEvent, followSet);

  log(`followSet: cache is updated`);

  return { followSet, latestEvent: signedEvent };
}

export async function publishEvent({ event, relays }) {
  const pool = new SimplePool();

  const res = await pool.publish(relays, event);

  const events = await Promise.allSettled(res);

  return {
    fulfilled: events.filter((e) => e.status === "fulfilled"),
    rejected: events.filter((e) => e.status === "rejected"),
  };
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
  const cachedNotes = getFromPageCache(cacheKey) || [];

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

        insertToPageCache(cacheKey, cachedNotes);
      },
      alreadyHaveEvent(id) {
        return notesSet.has(id);
      },
    },
  );

  return cachedNotes;
}

export async function getNostrizeUserPubkey({
  mode,
  nostrConnectSettings,
  canUseNip07 = true,
}) {
  if (mode === "anon") {
    return Either.left("don't use this method for anonymous mode");
  }

  if (mode === "nip07" && canUseNip07) {
    return Either.right(await getPubkeyFromNip07());
  } else if (mode === "nip07" && !canUseNip07) {
    return Either.left("can't use nip07 directly");
  } else if (mode === "nostrconnect" || mode === "bunker") {
    if (!nostrConnectSettings) {
      return Either.left("nostrconnect settings are required");
    }

    if (!nostrConnectSettings.userPubkey) {
      return Either.left(
        "nostrconnect user pubkey is not set, check nostrconnect settings",
      );
    }

    return Either.right(nostrConnectSettings.userPubkey);
  } else {
    throw new Error("not implemented");
  }
}
