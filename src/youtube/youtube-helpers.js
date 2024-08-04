import { nip19 } from "nostr-tools";

import { fetchFromNip05 } from "../components/zap-modal.js";

import { getLocalSettings, getOrInsertCache } from "../helpers/local-cache.js";
import { delay, Either } from "../helpers/utils.js";

export async function getPubkeyFrom({ npub, nip05, channel }) {
  if (npub) {
    const { type, data } = nip19.decode(npub);

    if (type !== "npub") {
      throw new Error("nip19 error");
    }

    return data;
  }

  const { pubkey } = await getOrInsertCache(`yt_user_pubkey:${channel}`, () => {
    const [username, domain] = nip05.split("@");
    const fetchUrl = `https://${domain}/.well-known/nostr.json?user=${username}`;

    Either.getOrElseThrow({
      eitherFn: () => fetchFromNip05({ user: username, fetchUrl }),
    });
  });

  return pubkey;
}

export async function loadParamsFromChannelPage() {
  let channelNameLink = document.querySelector("ytd-channel-name a");

  while (!channelNameLink) {
    // need to wait a bit for document to load
    await delay(500);

    channelNameLink = document.querySelector("ytd-channel-name a");
  }

  // will give /@ChannelName
  const channelName = channelNameLink.attributes["href"].value;

  const res = await fetch(`https://www.youtube.com${channelName}`);
  const channelHtml = await res.text();

  const parser = new DOMParser();
  const channelDocument = parser.parseFromString(channelHtml, "text/html");

  const { nip05, npub } = parseDescription(
    channelDocument.querySelector('meta[property="og:description"]'),
  );

  const canLoad = nip05 || npub;

  if (canLoad) {
    const channel = channelName.substring(2);

    const settings = await getLocalSettings();

    return Either.right({ nip05, npub, channel, settings });
  }

  return Either.left("Channel doesn't have a Nostrize integration");
}

function parseDescription({ content }) {
  const lines = content.trim().split("\n");

  let npub, nip05;

  for (const line of lines) {
    if (line.startsWith("nip05:")) {
      nip05 = line.replace("nip05:", "").trim();
    } else if (line.startsWith("npub:")) {
      npub = line.replace("npub:", "").trim();
    }
  }

  return { npub, nip05 };
}
