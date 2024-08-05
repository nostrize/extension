import { getLocalSettings } from "../helpers/local-cache.js";
import { delay, Either } from "../helpers/utils.js";
import { parseDescription } from "../helpers/dom.js";

export async function getChannelName() {
  let channelNameLink =
    document.querySelector("ytd-channel-name a") ||
    document.querySelector("a.slim-owner-icon-and-title");

  while (!channelNameLink) {
    // need to wait a bit for document to load
    await delay(500);

    channelNameLink =
      document.querySelector("ytd-channel-name a") ||
      document.querySelector("a.slim-owner-icon-and-title");
  }

  // will give /@ChannelName
  return channelNameLink.attributes["href"].value;
}

export async function loadParamsFromChannelPage({ channelName }) {
  // to suport both m.youtube.com and www.youtube.com
  const currentHost = window.location.host;

  const res = await fetch(`https://${currentHost}${channelName}`);
  const channelHtml = await res.text();

  const parser = new DOMParser();
  const channelDocument = parser.parseFromString(channelHtml, "text/html");

  const { nip05, npub } = parseDescription(
    channelDocument.querySelector('meta[property="og:description"]'),
  );

  const canLoad = nip05 || npub;

  if (canLoad) {
    const channel = channelName.substring(2);

    return Either.right({ nip05, npub, channel });
  }

  return Either.left("Channel doesn't have a Nostrize integration");
}
