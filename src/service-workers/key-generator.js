import { createKeyPair, generateDerivedKeys } from "../helpers/crypto.js";

export const keyGeneratorListeners = (message, _, sendResponse) => {
  if (message.action === "generateKey") {
    console.log("received generateKey");

    const { pubkey } = createKeyPair();

    generateDerivedKeys({
      pubkey,
      passphrase: message.params.passphrase,
    }).then(({ firstDerivation, secondDerivation }) => {
      sendResponse({ firstDerivation, secondDerivation });
    });

    return true; // Keeps the message channel open for the async response
  }
};
