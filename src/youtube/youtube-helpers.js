import { getLocalSettings } from "../helpers/local-cache.js";
import { delay, Either } from "../helpers/utils.js";
import { parseDescription } from "../helpers/dom.js";

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
