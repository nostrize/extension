import { Relay } from "nostr-tools";

import {
  getPubkeyFrom,
  loadParamsFromChannelPage,
} from "../youtube-helpers.js";

import * as gui from "../../imgui-dom/gui.js";
import * as html from "../../imgui-dom/html.js";
import { getOrInsertCache } from "../../helpers/local-cache.js";
import { logger } from "../../helpers/logger.js";
import { delay, Either, singletonFactory } from "../../helpers/utils.js";
import {
  getZapEndpoint,
  zapModalComponent,
} from "../../components/zap-modal.js";
import { fetchOneEvent } from "../../helpers/relays.js";
import { createKeyPair } from "../../helpers/crypto.js";

async function youtubeShortsPage() {
  let tipButtonContainer = document.querySelector(
    "ytd-channel-name yt-formatted-string",
  );

  while (!tipButtonContainer) {
    await delay(500);

    tipButtonContainer = document.querySelector(
      "ytd-channel-name yt-formatted-string",
    );
  }

  const tipButtonId = "n-yt-shorts-tip-button";

  if (gui.gebid(tipButtonId)) {
    // if the tip button already exists, we don't need to load again
    return;
  }

  const paramsEither = await loadParamsFromChannelPage();

  if (Either.isLeft(paramsEither)) {
    console.log(paramsEither.error);

    return;
  }

  const { settings, nip05, npub, channel } = Either.getRight(paramsEither);

  const log = logger({ ...settings.debug, namespace: "[N][YT-Shorts]" });

  const pubkey = await getPubkeyFrom({ nip05, npub, channel });

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

  gui.prepend(
    tipButtonContainer,
    html.link({
      id: tipButtonId,
      classList: "yt-simple-endpoint style-scope n-shorts-tip-button",
      text: "⚡Tip⚡",
      href: "javascript:void(0)",
      onclick: () => (zapModal.style.display = "block"),
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

youtubeShortsPage().catch((e) => console.error(e));
