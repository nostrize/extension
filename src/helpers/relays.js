import { Relay } from "nostr-tools";

import { singletonFactory } from "./utils.js";

export async function fetchOneEvent({ relayFactory, filter, bolt11 }) {
  const relay = await relayFactory.getOrCreate();

  return new Promise((resolve, reject) => {
    try {
      const sub = relay.subscribe([filter], {
        onevent(event) {
          if (bolt11) {
            const bolt11Tag = getMatchedBolt11Tag({
              event,
              bolt11,
            });

            if (bolt11Tag) {
              sub.close();

              resolve(event);
            }
          } else {
            sub.close();

            resolve(event);
          }
        },
        onerror(e) {
          sub.close();

          reject(e);
        },
      });
    } catch (error) {
      reject(error);
    }
  });
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

function getMatchedBolt11Tag({ event, bolt11 }) {
  return event.tags.find((t) => {
    if (t[0] === "bolt11") {
      return bolt11 === t[1];
    }

    return false;
  });
}
