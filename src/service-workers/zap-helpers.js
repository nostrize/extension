import { Relay } from "nostr-tools";

import { getOrInsertCache } from "../helpers/local-cache.js";
import { Either, singletonFactory } from "../helpers/utils.js";
import { createKeyPair } from "../helpers/crypto.js";
import { fetchOneEvent } from "../helpers/relays.js";
import { getZapEndpoint } from "../components/zap-modal.js";
import { fetchFromNip05 } from "../helpers/nostr.js";

export const zapperListeners = (log) => (message, _, sendResponse) => {
  if (message.action === "fetchBunkerPointer") {
    log("received fetchBunkerPointer");

    getZapEventData({
      user: message.params.user,
      nostrRelayUrl: message.params.nostrRelayUrl,
      log,
    })
      .then(Either.toObject)
      .then(sendResponse);

    return true; // Keeps the message channel open for the async response
  }
};

async function getZapEventData({ user, nostrRelayUrl, log }) {
  const fetchUrl = `https://${user}.github.io/github-connect/.well-known/nostr.json`;

  const { pubkey } = await getOrInsertCache(`user_pubkey:${user}`, () =>
    Either.getOrElseThrow({
      eitherFn: () => fetchFromNip05({ user, fetchUrl }),
    }),
  );

  const relayFactory = singletonFactory({
    buildFn: async () => {
      const relay = new Relay(nostrRelayUrl);

      await relay.connect();

      return relay;
    },
  });

  const localNostrKeys = createKeyPair();

  const metadataEvent = await getOrInsertCache(`${pubkey}:kind0`, () =>
    fetchOneEvent({
      log,
      relayFactory,
      filter: { authors: [pubkey], kinds: [0], limit: 1 },
    }),
  );

  log("metadataEvent", metadataEvent);

  const lnurlData = await getOrInsertCache(metadataEvent.id, () =>
    Either.getOrElseThrow({
      eitherFn: () => getZapEndpoint({ metadataEvent, log }),
    }),
  );

  const zapEndpoint = lnurlData.callback;
  const recipient = lnurlData.nostrPubkey;

  return { zapEndpoint, recipient, localNostrKeys };
}
