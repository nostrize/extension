import { SimplePool } from "nostr-tools";

export function getNip07OrLocalRelays({ settings, timeout = 4000 }) {
  const shouldGetNip07Relays =
    settings.nostrSettings.mode === "nip07" &&
    settings.nostrSettings.nip07.useRelays;

  const localRelays = settings.nostrSettings.relays;

  if (shouldGetNip07Relays) {
    return new Promise((resolve) => {
      window.postMessage({ type: "nip07-relays-request", from: "nostrize" });

      if (timeout) {
        setTimeout(() => resolve(localRelays), timeout);
      }

      window.addEventListener("message", (event) => {
        if (event.source !== window) {
          return;
        }

        const { from, type, readRelays, writeRelays } = event.data;

        if (type !== "nip07-relays-request") {
          return;
        }

        if (from !== "nostrize-nip07-provider") {
          return;
        }

        return resolve({ readRelays, writeRelays });
      });
    });
  }

  return { readRelays: localRelays, writeRelays: localRelays };
}

export async function getPageUserRelays({ pubkey, relays }) {
  const filter = {
    kinds: [10002],
    authors: [pubkey],
    limit: 1,
  };

  const pool = new SimplePool();

  const latestEvent = await pool.get(relays, filter);

  if (latestEvent) {
    const pageUserReadRelays = [];
    const pageUserWriteRelays = [];

    latestEvent.tags.forEach((tag) => {
      if (tag[0] === "r") {
        const relay = tag[1];
        const canRead = tag[2] ? tag[2] === "read" : true;
        const canWrite = tag[2] ? tag[2] === "write" : true;

        if (canRead) {
          pageUserReadRelays.push(relay);
        }

        if (canWrite) {
          pageUserWriteRelays.push(relay);
        }
      }
    });

    return { pageUserReadRelays, pageUserWriteRelays, tags: latestEvent.tags };
  }

  return { pageUserReadRelays: [], pageUserWriteRelays: [], tags: [] };
}
