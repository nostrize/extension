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
import { getRelays } from "../../helpers/relays.js";
import { getMetadataEvent, getPubkeyFrom } from "../../helpers/nostr.js";
import { getLnurlData } from "../../helpers/lnurl.js";

async function youtubeWatchPage() {
  const settings = await getLocalSettings();

  const log = logger({ ...settings.debug, namespace: "[N][YT-Watch]" });

  await delay(2000);

  const tipButtonId = "n-yt-watch-tip-button";

  const channelName = await getChannelNameInWatch();

  const existingTipButton = gui.gebid(tipButtonId);

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

  const pubkey = await getPubkeyFrom({
    nip05,
    npub,
    username: channel,
    cachePrefix: "yt",
  });

  const relays = await html.asyncScript({
    id: "nostrize-nip07-provider",
    src: browser.runtime.getURL("nostrize-nip07-provider.js"),
    callback: () => getRelays({ settings, timeout: 4000 }),
  });

  log("relays", relays);

  const metadataEvent = await getMetadataEvent({
    cacheKey: pubkey,
    filter: { authors: [pubkey], kinds: [0], limit: 1 },
    relays,
  });

  const lnurlData = await getOrInsertCache({
    key: metadataEvent.id,
    insertCallback: () =>
      Either.getOrElseThrow({
        eitherFn: () => getLnurlData({ metadataEvent, log }),
      }),
  });

  const tipButton = html.link({
    id: tipButtonId,
    data: [["for-account", channelName]],
    classList: "n-shorts-tip-button yt-simple-endpoint style-scope",
    text: "⚡Tip⚡",
    href: "javascript:void(0);",
    onclick: async () => {
      const { zapModal, closeModal } = await zapModalComponent({
        user: channel,
        metadataEvent,
        lnurlData,
        log,
        relays,
        settings,
      });

      document.body.append(zapModal);

      // When the user clicks anywhere outside of the modal, close it
      window.onclick = function (event) {
        if (event.target == zapModal) {
          closeModal();
        }
      };

      // Listen for keydown events to close the modal when ESC is pressed
      window.addEventListener("keydown", function (event) {
        if (event.key === "Escape" || event.key === "Esc") {
          closeModal();
        }
      });

      zapModal.style.display = "block";

      return false;
    },
    style: [["color", "white"]],
  });

  gui.prepend(
    document.getElementById("middle-row") ||
      document.querySelector("ytm-slim-owner-renderer"),
    tipButton,
  );
}

youtubeWatchPage().catch((e) => console.error(e));
