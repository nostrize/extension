import browser from "webextension-polyfill";

import {
  getChannelNameInShorts,
  loadParamsFromChannelPage,
} from "../youtube-helpers.js";

import * as gui from "../../imgui-dom/gui.js";
import * as html from "../../imgui-dom/html.js";
import {
  getFromPageCache,
  getNostrizeSettings,
  getOrInsertPageCache,
  insertToPageCache,
} from "../../helpers/local-cache.js";
import { logger } from "../../helpers/logger.js";
import { Either, uniqueArrays } from "../../helpers/utils.js";
import { zapModalComponent } from "../../components/zap-modal.js";
import { getNostrizeUserRelays } from "../../helpers/relays.js";
import { getMetadataEvent, getPubkeyFrom } from "../../helpers/nostr.js";
import { getLnurlData } from "../../helpers/lnurl.js";
import { setupModal } from "../../components/common.js";
import { ensureDomLoaded } from "../../helpers/dom.js";

async function youtubeShortsPage() {
  const settings = await getNostrizeSettings();

  const log = logger({ ...settings.debug });

  const pageQueryForLoaded = "ytd-channel-name";

  await ensureDomLoaded(pageQueryForLoaded);

  const zapButtonId = "n-yt-shorts-tip-button";

  const { channelName, tipButtonContainer } = await getChannelNameInShorts();

  const removeNostrButtons = () => {
    gui.gebid(zapButtonId)?.remove();
  };

  removeNostrButtons();

  const channelParamsCacheKey = `nostrize-yt-channel-${channelName}`;

  let params = getFromPageCache(channelParamsCacheKey);

  if (!params) {
    const paramsEither = await loadParamsFromChannelPage({ channelName });

    if (Either.isLeft(paramsEither)) {
      log(paramsEither.error);

      return;
    }

    params = Either.getRight(paramsEither);

    insertToPageCache(channelParamsCacheKey, params);
  }

  const { nip05, npub, channel } = params;

  const pageUserPubkey = await getPubkeyFrom({
    nip05,
    npub,
    pageUsername: channel,
    cachePrefix: "yt",
  });

  await html.asyncScript({
    id: "nostrize-nip07-provider",
    src: browser.runtime.getURL("nostrize-nip07-provider.js"),
  });

  const nostrizeUserRelays = await getNostrizeUserRelays({
    settings,
    timeout: 4000,
  });

  const metadataEvent = await getMetadataEvent({
    relays: uniqueArrays(
      nostrizeUserRelays.readRelays,
      nostrizeUserRelays.writeRelays,
    ),
    cacheKey: pageUserPubkey,
    filter: { authors: [pageUserPubkey], kinds: [0], limit: 1 },
  });

  const lnurlData = await getOrInsertPageCache({
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
        nostrizeUserRelays,
        settings,
      });

      setupModal(modal, closeModal);
    },
  });

  gui.prepend(tipButtonContainer, zapButton);
}

youtubeShortsPage().catch((e) => console.error(e));
