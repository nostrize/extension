import { SimplePool, type Event } from "nostr-tools";

import { getOrInsertPageCache } from "./local-cache.js";

interface Relay {
  relay: string;
  read: boolean;
  write: boolean;
}

interface ReadWriteRelays {
  readRelays: string[];
  writeRelays: string[];
  flatRelays: Relay[];
  createdAt: number | null;
}

function toReadWriteRelays(relays: Event): ReadWriteRelays {
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

  return { readRelays, writeRelays, flatRelays, createdAt: relays.created_at };
}

interface GetNip65RelaysParams {
  pubkey: string;
  relays: string[];
  updatedCallback?: (relays: ReadWriteRelays) => void;
}

export async function getNip65Relays({
  pubkey,
  relays,
  updatedCallback,
}: GetNip65RelaysParams): Promise<ReadWriteRelays> {
  const response = (await getOrInsertPageCache({
    key: `nostrize-nip65-${pubkey}-${relays.join("")}`,
    insertCallback: () => fetchRelays({ pubkey, relays }),
    skipEmpty: true,
    updateCache: true,
    updatedCallback: (response: Event | null) => {
      if (updatedCallback) {
        if (response == null) {
          updatedCallback({
            readRelays: [],
            writeRelays: [],
            flatRelays: [],
            createdAt: null,
          });
        } else {
          updatedCallback(toReadWriteRelays(response));
        }
      }
    },
  })) as Event | null;

  if (response == null) {
    return { readRelays: [], writeRelays: [], flatRelays: [], createdAt: null };
  }

  return toReadWriteRelays(response);
}

interface FetchRelaysParams {
  pubkey: string;
  relays: string[];
}

async function fetchRelays({
  pubkey,
  relays,
}: FetchRelaysParams): Promise<Event | null> {
  const pool = new SimplePool();

  return pool.get(relays, {
    kinds: [10002],
    authors: [pubkey],
    limit: 1,
  });
}
