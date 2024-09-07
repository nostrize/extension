import browser from "webextension-polyfill";

import {
  getChannelNameInShorts,
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
import { getPageUserRelays } from "../../helpers/relays.js";
import { getMetadataEvent, getPubkeyFrom } from "../../helpers/nostr.js";
import { getLnurlData } from "../../helpers/lnurl.js";
import { setupModal } from "../../components/common.js";

async function youtubeShortsPage() {
  const settings = await getLocalSettings();

  const log = logger({ ...settings.debug, namespace: "[N][YT-Shorts]" });

  await delay(2000);

  const zapButtonId = "n-yt-shorts-tip-button";

  const { channelName, tipButtonContainer } = await getChannelNameInShorts();

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

  const accountPubkey = await getPubkeyFrom({
    nip05,
    npub,
    pageUsername: channel,
    cachePrefix: "yt",
  });

  const relays = await html.asyncScript({
    id: "nostrize-nip07-provider",
    src: browser.runtime.getURL("nostrize-nip07-provider.js"),
    callback: () =>
      getPageUserRelays({ pubkey: accountPubkey, settings, timeout: 4000 }),
  });

  log("relays", relays);

  const metadataEvent = await getMetadataEvent({
    relays,
    cacheKey: accountPubkey,
    filter: { authors: [accountPubkey], kinds: [0], limit: 1 },
  });

  const lnurlData = await getOrInsertCache({
    key: `nostrize-lnurldata-${metadataEvent.id}`,
    insertCallback: () =>
      Either.getOrElseThrow({
        eitherFn: () => getLnurlData({ metadataEvent, log }),
      }),
  });

  if (gui.gebid(zapButtonId)) {
    // if the tip button already exists, we don't need to load again
    return;
  }

  const zapButton = html.link({
    id: zapButtonId,
    data: [["for-account", channelName]],
    classList: "yt-simple-endpoint style-scope n-shorts-tip-button",
    text: "⚡Tip⚡",
    href: "javascript:void(0)",
    onclick: async () => {
      const { modal, closeModal } = await zapModalComponent({
        user: channel,
        metadataEvent,
        lnurlData,
        log,
        relays,
        settings,
      });

      setupModal(modal, closeModal);
    },
  });

  gui.prepend(tipButtonContainer, zapButton);
}

youtubeShortsPage().catch((e) => console.error(e));
