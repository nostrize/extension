import { generateSecretKey, getPublicKey } from "nostr-tools";

export function createKeyPair() {
  const secret = generateSecretKey();
  const pubkey = getPublicKey(secret);

  return { secret, pubkey };
}
