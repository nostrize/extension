import { SimplePool } from "nostr-tools";

import { getOrInsertPageCache } from "./local-cache.js";

function toReadWriteRelays(relays) {
  const relayTags = relays.tags.filter((tag) => tag[0] === "r");

  const readRelays = relayTags
    .filter((tag) => (tag[0] === "r" && tag[2] === "read") || !tag[2])
    .map((tag) => tag[1]);

  const writeRelays = relayTags
    .filter((tag) => (tag[0] === "r" && tag[2] === "write") || !tag[2])
    .map((tag) => tag[1]);

  const flatRelays = relayTags.map((tag) => ({
    relay: tag[1],
    read: tag[2] === "read" || !tag[2],
    write: tag[2] === "write" || !tag[2],
  }));

  return { readRelays, writeRelays, flatRelays };
}

export async function getNip65Relays({ pubkey, relays, updatedCallback }) {
  const response = await getOrInsertPageCache({
    key: `nostrize-nip65-${pubkey}-${relays.join("")}`,
    insertCallback: () => fetchRelays({ pubkey, relays }),
    skipEmpty: true,
    updateCache: true,
    updatedCallback: (response) => {
      if (updatedCallback) {
        if (response == null) {
          updatedCallback({ readRelays: [], writeRelays: [] });
        } else {
          updatedCallback(toReadWriteRelays(response));
        }
      }
    },
  });

  if (response == null) {
    return { readRelays: [], writeRelays: [] };
  }

  return toReadWriteRelays(response);
}

async function fetchRelays({ pubkey, relays }) {
  const pool = new SimplePool();

  return pool.get(relays, {
    kinds: [10002],
    authors: [pubkey],
    limit: 1,
  });
}
