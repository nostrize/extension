import { finalizeEvent, nip04, Relay } from "nostr-tools";

import { createKeyPair } from "./crypto.js";
import { requestSigningFromNip07 } from "./nostr.js";
import { generateRandomHexString } from "./utils.js";

async function signEventWithNostrConnect({
  eventTemplate,
  nostrConnectSettings,
}) {
  if (!nostrConnectSettings) {
    throw new Error(
      "Remote Signer settings are required, check Remote Signer settings",
    );
  }

  if (!nostrConnectSettings.userPubkey) {
    throw new Error("User pubkey is required, check Remote Signer settings");
  }

  if (!nostrConnectSettings.providerRelay) {
    throw new Error("Provider relay is required, check Remote Signer settings");
  }

  if (!nostrConnectSettings.ephemeralKey) {
    const { secret, pubkey } = createKeyPair();

    nostrConnectSettings.ephemeralKey = secret;
    nostrConnectSettings.ephemeralPubkey = pubkey;
  }

  const id = generateRandomHexString(64);

  const { kind, content, tags, created_at } = eventTemplate;

  if (kind == null || content == null || tags == null || created_at == null) {
    throw new Error("Event template has missing required fields");
  }

  const encryptedMessage = await nip04.encrypt(
    nostrConnectSettings.ephemeralKey,
    nostrConnectSettings.userPubkey,
    JSON.stringify({
      id,
      method: "sign_event",
      params: [
        JSON.stringify({
          kind,
          content,
          tags,
          created_at,
        }),
      ],
    }),
  );

  const eventTemplateForSigning = {
    kind: 24133,
    pubkey: nostrConnectSettings.ephemeralPubkey,
    content: encryptedMessage,
    tags: [["p", nostrConnectSettings.userPubkey]],
    created_at: Math.floor(Date.now() / 1000),
  };

  const signedEvent = finalizeEvent(
    eventTemplateForSigning,
    nostrConnectSettings.ephemeralKey,
  );

  const r = new Relay(nostrConnectSettings.providerRelay);

  await r.connect();
  await r.publish(signedEvent);

  return new Promise((resolve, reject) => {
    // fetch the response
    const sub = r.subscribe(
      [
        {
          kinds: [24133],
          authors: [nostrConnectSettings.userPubkey],
          "#p": [nostrConnectSettings.ephemeralPubkey],
          limit: 1,
        },
      ],
      {
        onevent: async (event) => {
          const decrypted = await nip04.decrypt(
            nostrConnectSettings.ephemeralKey,
            nostrConnectSettings.userPubkey,
            event.content,
          );

          let parsed;

          try {
            parsed = JSON.parse(decrypted);
          } catch (e) {
            reject(e);

            sub.close();

            return;
          }

          if (parsed.id !== id) {
            return;
          }

          if (parsed.result === "auth_url") {
            window.open(parsed.error, "_blank");
          } else if (!parsed.error) {
            try {
              resolve(JSON.parse(parsed.result));
            } catch (e) {
              reject(e);
            }

            sub.close();
          } else {
            reject(parsed.error);

            sub.close();
          }
        },
      },
    );
  });
}

export async function signEvent({ mode, eventTemplate, nostrConnectSettings }) {
  if (mode === "anon") {
    const localNostrKeys = createKeyPair();

    return finalizeEvent(eventTemplate, localNostrKeys.secret);
  } else if (mode === "nip07") {
    return requestSigningFromNip07({
      from: "nostrize",
      type: "nip07-sign-request",
      eventTemplate,
    });
  } else if (mode === "nostrconnect" || mode === "bunker") {
    return signEventWithNostrConnect({ eventTemplate, nostrConnectSettings });
  } else {
    throw new Error("not implemented");
  }
}
