import { generateSecretKey, getPublicKey } from "nostr-tools";
import { bytesToHex } from "@noble/hashes/utils";

export function createKeyPair() {
  const secret = bytesToHex(generateSecretKey());
  const pubkey = getPublicKey(secret);

  return { secret, pubkey };
}
