import { Relay } from "nostr-tools";

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
import { delay, Either, singletonFactory } from "../../helpers/utils.js";
import {
  getZapEndpoint,
  zapModalComponent,
} from "../../components/zap-modal.js";
import { fetchOneEvent } from "../../helpers/relays.js";
import { createKeyPair } from "../../helpers/crypto.js";
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

  const relayFactory = singletonFactory({
    buildFn: async () => {
      const relay = new Relay(settings.nostrSettings.nostrRelayUrl);

      await relay.connect();

      return relay;
    },
  });

  const metadataEvent = await getOrInsertCache(`${pubkey}:kind0`, () =>
    fetchOneEvent({
      log,
      relayFactory,
      filter: { authors: [pubkey], kinds: [0], limit: 1 },
    }),
  );

  const lnurlData = await getOrInsertCache(metadataEvent.id, () =>
    Either.getOrElseThrow({
      eitherFn: () => getZapEndpoint({ metadataEvent, log }),
    }),
  );

  const localNostrKeys = createKeyPair();
  const zapEndpoint = lnurlData.callback;
  const recipient = lnurlData.nostrPubkey;

  const { zapModal, closeModal } = zapModalComponent({
    user: channel,
    metadataEvent,
    lnurlData,
    localNostrKeys,
    log,
    recipient,
    relayFactory,
    settings,
    zapEndpoint,
  });

  if (gui.gebid(tipButtonId)) {
    log("zap button already there, don't need to load");

    return;
  }

  gui.prepend(
    document.getElementById("middle-row") ||
      document.querySelector("ytm-slim-owner-renderer"),
    html.link({
      id: tipButtonId,
      classList: "n-shorts-tip-button yt-simple-endpoint style-scope",
      text: "⚡Tip⚡",
      href: "javascript:void(0);",
      onclick: () => {
        zapModal.style.display = "block";

        return false;
      },
      style: [["color", "white"]],
    }),
  );

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
}

youtubeWatchPage().catch((e) => console.error(e));
