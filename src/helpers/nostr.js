import { nip19 } from "nostr-tools";

import { getOrInsertCache } from "./local-cache.js";
import { Either } from "./utils.js";

export async function getPubkeyFrom({ npub, nip05, username, cachePrefix }) {
  if (npub) {
    const { type, data } = nip19.decode(npub);

    if (type !== "npub") {
      throw new Error("nip19 error");
    }

    return data;
  }

  const { pubkey } = await getOrInsertCache(
    `${cachePrefix}_user_pubkey:${username}`,
    () => {
      const [username, domain] = nip05.split("@");
      const fetchUrl = `https://${domain}/.well-known/nostr.json?user=${username}`;

      Either.getOrElseThrow({
        eitherFn: () => fetchFromNip05({ user: username, fetchUrl }),
      });
    },
  );

  return pubkey;
}

export async function fetchFromNip05({ user, fetchUrl }) {
  try {
    const response = await fetch(fetchUrl);

    if (!response.ok) {
      return Either.left(
        `nip05 fetch response error with status: ${response.status}`,
      );
    }

    const json = await response.json();
    const pubkey = json["names"][user];

    if (!pubkey) {
      return Either.left(
        `could not find pubkey for user ${user} in nostr.json`,
      );
    }

    const nip46 = json["nip46"];
    const relays = nip46 ? nip46[pubkey] || [] : [];

    return Either.right({ pubkey, relays });
  } catch (error) {
    return Either.left(`nip05 fetch error ${error}`);
  }
}
