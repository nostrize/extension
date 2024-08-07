import browser from "webextension-polyfill";

import {
  getChannelName,
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
import { getLnurlData, zapModalComponent } from "../../components/zap-modal.js";
import { fetchOneEvent, getRelayFactory } from "../../helpers/relays.js";
import { getPubkeyFrom } from "../../helpers/nostr.js";

async function youtubeWatchPage() {
  const settings = await getLocalSettings();

  const log = logger({ ...settings.debug, namespace: "[N][YT-Watch]" });

  await delay(200);

  const tipButtonId = "n-yt-watch-tip-button";

  if (gui.gebid(tipButtonId)) {
    log("zap button already there, don't need to load");

    return;
  }

  html.script({ src: browser.runtime.getURL("nostrize-nip07-provider.js") });

  const channelName = await getChannelName();
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

  const relayFactory = getRelayFactory({
    relays: settings.nostrSettings.relays,
  });

  const metadataEvent = await getOrInsertCache(`${pubkey}:kind0`, () =>
    fetchOneEvent({
      relayFactory,
      filter: { authors: [pubkey], kinds: [0], limit: 1 },
    }),
  );

  const lnurlData = await getOrInsertCache(metadataEvent.id, () =>
    Either.getOrElseThrow({
      eitherFn: () => getLnurlData({ metadataEvent, log }),
    }),
  );

  if (gui.gebid(tipButtonId)) {
    log("zap button already there, don't need to load");

    return;
  }

  const tipButton = html.link({
    id: tipButtonId,
    classList: "n-shorts-tip-button yt-simple-endpoint style-scope",
    text: "⚡Tip⚡",
    href: "javascript:void(0);",
    onclick: async () => {
      const { zapModal, closeModal } = await zapModalComponent({
        user: channel,
        metadataEvent,
        lnurlData,
        log,
        relayFactory,
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