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

// function test() {
//   const examples = [
//     `something without n-pub or nip 05`,
//     `@HodlWithLedn
// . All opinions are my own.
// Bitcoiner. Author of Nostream.
// ⚡cameri@stacker.news
// npub1qqqqqqyz0la2jjl752yv8h7wgs3v098mh9nztd4nr6gynaef6uqqt0n47m`,
//     `The browser extension that empowers any website with the Nostr experience

// npub: npub1j7kz05dn487xzps2tr2rszansynkdunjjruhwqsexhpjqcvkgwms0pe7fr`,
//     `nostr:npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m`,
//     `Building on C#, Bitcoin &
// @BtcPayServer
// .

// nostr:npub1y24gz5gwucl79vtv4ctwpysl0r5m4xyzu2rgulnr44ks3t5mt92q4nz2ad`,
//     `#nostr #npub1z4m7gkva6yxgvdyclc7zp0vz4ta0s2d9jh8g83w03tp5vdf3kzdsxana6p`,
//     `The browser extension that empowers any website with the Nostr experience

// npub: npub1j7kz05dn487xzps2tr2rszansynkdunjjruhwqsexhpjqcvkgwms0pe7fr
// nip05: nostrize@nostrize.me`,
//   ];

//   // Test each example and extract the "npub1" string
//   examples.forEach((ex) => {
//     const { npub, nip05 } = parseDescription({
//       content: ex,
//       log: (x) => console.log(x),
//     });
//     console.log(npub, nip05);
//   });
// }

// test();
