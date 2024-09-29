import { Either } from "./either.ts";

export async function getLnurlData({ metadataEvent, log }) {
  try {
    let { lud16 } = JSON.parse(metadataEvent.content);

    if (lud16) {
      const [name, domain] = lud16.split("@");

      const lnurl = new URL(
        `/.well-known/lnurlp/${name}`,
        `https://${domain}`,
      ).toString();

      const res = await fetch(lnurl);
      const body = await res.json();

      log(`fetch ${lnurl}`, body);

      if (body.allowsNostr && body.nostrPubkey) {
        return Either.right(body);
      } else {
        return Either.left("allowsNostr or nostrPubkey is not present");
      }
    } else {
      return Either.left("Could not find lud16 from kind0 event");
    }
  } catch (err) {
    return Either.left(err.toString());
  }
}
