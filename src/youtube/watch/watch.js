import browser from "webextension-polyfill";

import {
  getChannelNameInWatch,
  loadParamsFromChannelPage,
} from "../youtube-helpers.js";

import * as gui from "../../imgui-dom/gui.js";
import * as html from "../../imgui-dom/html.js";
import {
  getFromCache,
  getLocalSettings,
  getOrInsertCache,
  insertToCache,
} from "../../helpers/local-cache.js";
import { logger } from "../../helpers/logger.js";
import { delay, Either } from "../../helpers/utils.js";
import { zapModalComponent } from "../../components/zap-modal.js";
import {
  getNip07OrLocalRelays,
  getPageUserRelays,
} from "../../helpers/relays.js";
import { getMetadataEvent, getPubkeyFrom } from "../../helpers/nostr.js";
import { getLnurlData } from "../../helpers/lnurl.js";
import { setupModal } from "../../components/common.js";

async function youtubeWatchPage() {
  const settings = await getLocalSettings();

  const log = logger({ ...settings.debug, namespace: "[N][YT-Watch]" });

  await delay(2000);

  const zapButtonId = "n-yt-watch-tip-button";

  const channelName = await getChannelNameInWatch();

  // TODO: Use the removeNostrButtons way from twitter/profile/profile.js
  // Remove all nostr buttons in the beginning
  const existingTipButton = gui.gebid(zapButtonId);

  if (existingTipButton) {
    log("zap button already there");

    if (existingTipButton.attributes["data-for-account"] !== channelName) {
      log("button doesn't belong to account", channelName);

      existingTipButton.parentElement.removeChild(existingTipButton);
    } else {
      log("don't need to load");

      return;
    }
  }

  const channelParamsCacheKey = `yt-channel-${channelName}`;

  let params = getFromCache(channelParamsCacheKey);

  if (!params) {
    const paramsEither = await loadParamsFromChannelPage({ channelName });

    if (Either.isLeft(paramsEither)) {
      log(paramsEither.error);

      return;
    }

    params = Either.getRight(paramsEither);

    insertToCache(channelParamsCacheKey, params);
  }

  const { nip05, npub, channel } = params;

  const pageUserPubkey = await getPubkeyFrom({
    nip05,
    npub,
    pageUsername: channel,
    cachePrefix: "yt",
  });

  const nostrizeUserRelays = await html.asyncScript({
    id: "nostrize-nip07-provider",
    src: browser.runtime.getURL("nostrize-nip07-provider.js"),
    callback: () => getNip07OrLocalRelays({ settings, timeout: 4000 }),
  });

  log("nostrizeUserRelays", nostrizeUserRelays);

  const pageUserRelays = await getPageUserRelays({
    pubkey: pageUserPubkey,
    relays: nostrizeUserRelays,
    timeout: 4000,
  });

  const metadataEvent = await getMetadataEvent({
    cacheKey: pageUserPubkey,
    filter: { authors: [pageUserPubkey], kinds: [0], limit: 1 },
    relays: pageUserRelays,
  });

  const lnurlData = await getOrInsertCache({
    key: `nostrize-lnurldata-${metadataEvent.id}`,
    insertCallback: () =>
      Either.getOrElseThrow({
        eitherFn: () => getLnurlData({ metadataEvent, log }),
      }),
  });

  const zapButton = html.link({
    id: zapButtonId,
    data: [["for-account", channelName]],
    classList: "n-shorts-tip-button yt-simple-endpoint style-scope",
    text: "⚡Zap⚡",
    href: "javascript:void(0);",
    onclick: async () => {
      const { modal, closeModal } = await zapModalComponent({
        user: channel,
        metadataEvent,
        lnurlData,
        log,
        relays: nostrizeUserRelays,
        settings,
      });

      setupModal(modal, closeModal);
    },
    style: [["color", "white"]],
  });

  gui.prepend(
    document.getElementById("middle-row") ||
      document.querySelector("ytm-slim-owner-renderer"),
    zapButton,
  );
}

youtubeWatchPage().catch((e) => console.error(e));
