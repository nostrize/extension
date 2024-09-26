import { nip19 } from "nostr-tools";

export function parseDescription({ content, log }) {
  const npubMatch = content.match(/npub1[a-z0-9]{58}/);

  let pubkey;
  let npub = npubMatch && npubMatch.length ? npubMatch[0] : undefined;

  if (npub) {
    const { type, data } = nip19.decode(npub);

    if (type !== "npub") {
      log("npub decode error");

      npub = undefined;
    } else {
      pubkey = data;
    }
  }

  const nip05Match = content.match(/^nip05:\s*([^\s@]+@[^\s@]+\.[^\s@]+)$/m);

  const nip05 =
    nip05Match && nip05Match.length === 2 ? nip05Match[1] : undefined;

  return { npub, pubkey, nip05 };
}

export function ensureDomLoaded(queryParam, waitFor = 200) {
  return new Promise((resolve) => {
    const checkElement = () => {
      const element = document.querySelector(queryParam);

      if (element) {
        resolve(element);
      } else {
        setTimeout(checkElement, waitFor);
      }
    };

    checkElement();
  });
}
