import { nip19, SimplePool } from "nostr-tools";

import {
  getFromCache,
  getOrInsertCache,
  insertToCache,
} from "./local-cache.js";
import { Either } from "./utils.js";

export async function getUserPubkey({ settings, timeout = 1000 }) {
  if (settings.nostrSettings.mode === "nip07") {
    return new Promise((resolve) => {
      window.addEventListener("message", (event) => {
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

        return resolve(pubkey);
      });

      window.postMessage({ type: "nip07-pubkey-request", from: "nostrize" });

      setTimeout(() => resolve(null), timeout);
    });
  } else {
    return null;
  }
}

export async function getPubkeyFrom({ npub, nip05, username, cachePrefix }) {
  if (npub) {
    const { type, data } = nip19.decode(npub);

    if (type !== "npub") {
      throw new Error("nip19 error");
    }

    return data;
  }

  const { pubkey } = await getOrInsertCache({
    key: `nostrize-nip05-${cachePrefix}-${username}`,
    insertCallback: () => {
      const [username, domain] = nip05.split("@");
      const fetchUrl = `https://${domain}/.well-known/nostr.json?user=${username}`;

      Either.getOrElseThrow({
        eitherFn: () => fetchFromNip05({ user: username, fetchUrl }),
      });
    },
  });

  return pubkey;
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

export async function getFollowSet({ pubkey, relays, timeout = 1000 }) {
  const cacheKey = `nostrize-follow-list-${pubkey}-created_at`;
  const cache = getFromCache(cacheKey);
  const since = cache ? cache.created_at : undefined;

  const filter = {
    kinds: [3],
    authors: [pubkey],
    limit: 1,
    since,
  };

  const pool = new SimplePool();

  const latestEvent = await pool.get(relays, filter, { maxWait: timeout });

  if (latestEvent) {
    const followSet = new Set(
      latestEvent.tags.reduce((acc, tag) => {
        if (tag[0] === "p") {
          acc.push(tag[1]);
        }
        return acc;
      }, []),
    );

    insertToCache(cacheKey, latestEvent.created_at);

    return followSet;
  }

  return new Set();
}
