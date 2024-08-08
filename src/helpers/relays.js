import { Relay } from "nostr-tools";

import { singletonFactory } from "./utils.js";

export function getRelays({
  settings,
  haveNip07Provider = false,
  timeout = 4000,
}) {
  const shouldGetNip07Relays =
    haveNip07Provider &&
    settings.nostrSettings.mode === "nip07" &&
    settings.nostrSettings.nip07.useRelays;

  const localRelays = settings.nostrSettings.relays;

  if (shouldGetNip07Relays) {
    return new Promise((resolve) => {
      window.postMessage(
        { type: "nip07-relays-request", from: "nostrize" },
        "*",
      );

      setTimeout(() => resolve(localRelays), timeout);

      window.addEventListener("message", (event) => {
        if (event.source !== window) {
          return;
        }

        const { from, type, relays } = event.data;

        if (type !== "nip07-relays-request") {
          return;
        }

        if (from !== "nostrize-nip07-provider") {
          return;
        }

        console.log("relays", relays);

        return resolve([...new Set(relays.concat(localRelays))]);
      });
    });
  }

  return localRelays;
}

export function getRelayFactory({ relays }) {
  return singletonFactory({
    buildFn: async () => {
      // TODO: use SimplePool with all the relays
      const relay = new Relay(relays[0]);

      await relay.connect();

      return relay;
    },
  });
}
