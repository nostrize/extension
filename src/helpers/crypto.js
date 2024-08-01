import { pbkdf2 } from "crypto";
import { generateSecretKey, getPublicKey } from "nostr-tools";

export function createKeyPair() {
  const secret = generateSecretKey();
  const pubkey = getPublicKey(secret);

  return { secret, pubkey };
}

export async function generateDerivedKeys({ pubkey, passphrase }) {
  const salt = Buffer.from(pubkey, "hex");

  // https://nodejs.org/api/crypto.html#using-strings-as-inputs-to-cryptographic-apis
  // https://github.com/ricmoo/scrypt-js#encoding-notes
  passphrase = passphrase.normalize("NFKC");

  if (!isValidPassphase(passphrase)) {
    throw new Error("Password must be 6+ chars");
  }

  const TEN_MILLION = 10000000;
  const HUNDRED_THOUSAND = 100000;
  const ITERATION_1st = TEN_MILLION;
  const ITERATION_2nd = HUNDRED_THOUSAND;
  const HASH_SIZE = 32;
  const HASH_ALGO = "sha256";

  return new Promise((resolve, reject) => {
    // NOTE: we should use Argon2 or scrypt later, for now
    // let's start with a widespread and natively-supported pbkdf2
    pbkdf2(
      passphrase,
      salt,
      ITERATION_1st,
      HASH_SIZE,
      HASH_ALGO,
      (err, firstDerivation) => {
        if (err) {
          reject(err);
        } else {
          // second derivation key from first derivation key and the passphrase
          pbkdf2(
            firstDerivation,
            passphrase,
            ITERATION_2nd,
            HASH_SIZE,
            HASH_ALGO,
            (err, secondDerivation) => {
              if (err) reject(err);
              else
                resolve({
                  firstDerivation,
                  secondDerivationHash: secondDerivation.toString("hex"),
                });
            },
          );
        }
      },
    );
  });
}

function isValidPassphase(passphrase) {
  return /^.{6,}$/.test(passphrase.normalize("NFKC"));
}
