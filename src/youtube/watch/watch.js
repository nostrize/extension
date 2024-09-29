import browser from "webextension-polyfill";

import {
  getChannelNameInWatch,
  loadParamsFromChannelPage,
} from "../youtube-helpers.js";

import * as gui from "../../imgui-dom/gui.js";
import * as html from "../../imgui-dom/html.js";
import {
  getFromPageCache,
  getOrInsertPageCache,
  insertToPageCache,
} from "../../helpers/local-cache.js";
import { logger } from "../../helpers/logger.js";
import { uniqueArrays } from "../../helpers/utils.js";
import { Either } from "../../helpers/either.ts";
import { zapModalComponent } from "../../components/zap-modal.js";
import { getNostrizeUserRelays } from "../../helpers/relays.js";
import {
  getMetadataEvent,
  getNostrizeUserPubkey,
  getPubkeyFrom,
} from "../../helpers/nostr.js";
import { getLnurlData } from "../../helpers/lnurl.js";
import { setupModal } from "../../components/common.js";
import { getNip65Relays } from "../../helpers/nip65.js";
import { ensureDomLoaded } from "../../helpers/dom.js";
import { getNostrizeSettings } from "../../helpers/accounts.ts";

async function youtubeWatchPage() {
  const settings = Either.getOrElseThrow({ eitherFn: getNostrizeSettings });

  const log = logger({ ...settings.debug });

  const pageQueryForLoaded = "ytd-channel-name";

  await ensureDomLoaded(pageQueryForLoaded);

  const zapButtonId = "n-yt-watch-tip-button";

  const channelName = await getChannelNameInWatch();

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

  const nostrizeUserPubkey = await getNostrizeUserPubkey({
    mode: settings.nostrSettings.mode,
    nostrConnectSettings: settings.nostrSettings.nostrConnect,
  });

  const nostrizeUserRelays = await getNostrizeUserRelays({
    settings,
    pubkey: nostrizeUserPubkey,
  });

  log("nostrizeUserRelays", nostrizeUserRelays);

  const pageUserRelays = await getNip65Relays({
    pubkey: pageUserPubkey,
    relays: uniqueArrays(
      nostrizeUserRelays.readRelays,
      nostrizeUserRelays.writeRelays,
    ),
  });

  const metadataEvent = await getMetadataEvent({
    cacheKey: pageUserPubkey,
    filter: { authors: [pageUserPubkey], kinds: [0], limit: 1 },
    relays: pageUserRelays.writeRelays,
  });

  const lnurlData = await getOrInsertPageCache({
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
        nostrizeUserRelays,
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
