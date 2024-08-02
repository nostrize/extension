import { Relay, verifyEvent } from "nostr-tools";
import { encrypt } from "nostr-tools/nip04";

import { fetchFromNip05 } from "../github/profile/profile-helper.js";
import { Either, generateRandomHexString } from "../helpers/utils.js";

export const fetchBunkerPointerListeners =
  (log) => (message, _, sendResponse) => {
    if (message.action === "fetchBunkerPointer") {
      log("received fetchBunkerPointer");

      fetchBunkerPointer({
        user: message.params.user,
        log,
      })
        .then(Either.toObject)
        .then(sendResponse);

      return true; // Keeps the message channel open for the async response
    }
  };

export async function fetchBunkerPointer({ user, log }) {
  const fetchBunkerNip05 = `https://${user}.github.io/github-connect/.well-known/nip46.txt`;

  let response;

  try {
    response = await fetch(fetchBunkerNip05);
  } catch (error) {
    return Either.left(`nip46.txt fetch error: ${error}`);
  }

  if (!response.ok) {
    return Either.left(
      `nip46.txt fetch response error with status: ${response.status}`,
    );
  }

  const bunkerNip05 = await response.text();
  const [_, bunkerDomain] = bunkerNip05.split("@");
  const fetchBunkerUrl = `https://${bunkerDomain}/.well-known/nostr.json?user=_`;

  log("bunker url", fetchBunkerUrl);

  const bunkerPointer = await Either.getOrElseThrow({
    eitherFn: () => fetchFromNip05({ user: "_", fetchUrl: fetchBunkerUrl }),
  });

  if (!bunkerPointer.relays.length) {
    return Either.left(`bunker relays.length is 0`);
  }

  return Either.right(bunkerPointer);
}

async function getBunkerSignedEvent({ bunkerPointer, localNostrKeys, log }) {
  // STEP 2: Clients use the local keypair to send requests to the remote signer by p-tagging and encrypting to the remote user pubkey.
  const encryptedContent = await encrypt(
    localNostrKeys.secret,
    localNostrKeys.pubkey,
    JSON.stringify({
      id: generateRandomHexString(32),
      method: "sign_event",
      params: [
        JSON.stringify({
          content: "Hello, I'm signing remotely",
          kind: 1,
          tags: [],
          created_at: 1714078911,
        }),
      ],
    }),
  );

  const bunkerEventTemplate = {
    kind: 24133,
    pubkey: localNostrKeys.pubkey,
    content: encryptedContent,
    tags: [["p", bunkerPointer.pubkey]],
  };

  const bunkerRelay = new Relay(bunkerPointer.relays[0]);
  await bunkerRelay.connect();

  await bunkerRelay.send(JSON.stringify(bunkerEventTemplate));

  const signedEvent = await new Promise((resolve, reject) => {
    const bunkerSub = bunkerRelay.subscribe(
      [
        {
          kinds: [24133],
          authors: [bunkerPointer.pubkey],
          "#p": [localNostrKeys.pubkey],
        },
      ],
      {
        onevent(e) {
          log("bunker event", e);

          bunkerSub.close();

          return resolve(e);
        },
        onerror(e) {
          log("bunker event error", e);

          bunkerSub.close();

          return reject(e);
        },
      },
    );
  });

  if (!verifyEvent(signedEvent)) {
    throw new Error("Event verification has failed");
  }

  return signedEvent;
}
