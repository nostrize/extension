import { SimplePool } from "nostr-tools";

import { getOrInsertPageCache } from "./local-cache.js";

function toReadWriteRelays(relays) {
  const readRelays = relays.tags
    .filter((tag) => (tag[0] === "r" && tag[2] === "read") || !tag[2])
    .map((tag) => tag[1]);

  const writeRelays = relays.tags
    .filter((tag) => (tag[0] === "r" && tag[2] === "write") || !tag[2])
    .map((tag) => tag[1]);

  return { readRelays, writeRelays };
}

export async function getNip65Relays({ pubkey, relays }) {
  const response = await getOrInsertPageCache({
    key: `nostrize-nip65-${pubkey}-${relays.join("")}`,
    insertCallback: () => fetchRelays({ pubkey, relays }),
    skipEmpty: true,
    updateCache: true,
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
