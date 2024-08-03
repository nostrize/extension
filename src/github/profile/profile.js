import { Relay } from "nostr-tools";

import { logger } from "../../helpers/logger.js";
import {
  getLocalSettings,
  getOrInsertCache,
} from "../../helpers/local-cache.js";
import { fetchOneEvent } from "../../helpers/relays.js";
import { createKeyPair } from "../../helpers/crypto.js";
import * as html from "../../imgui-dom/html.js";
import * as gui from "../../imgui-dom/gui.js";
import { singletonFactory, Either } from "../../helpers/utils.js";
import {
  fetchFromNip05,
  getZapEndpoint,
  zapModalComponent,
} from "../../components/zap-modal.js";

async function githubProfilePage() {
  const settings = await getLocalSettings();

  const pathParts = window.location.pathname
    .split("/")
    .filter((part) => part.length > 0);

  // Assuming the URL pattern is https://github.com/{user}
  if (pathParts.length !== 1) {
    return;
  }

  const log = logger({ ...settings.debug, namespace: "[N][Profile]" });
  const user = pathParts[0];

  const fetchUrl = `https://${user}.github.io/github-connect/.well-known/nostr.json`;

  const { pubkey } = await getOrInsertCache(`user_pubkey:${user}`, () =>
    Either.getOrElseThrow({
      eitherFn: () => fetchFromNip05({ user, fetchUrl }),
    }),
  );

  const relayFactory = singletonFactory({
    buildFn: async () => {
      const relay = new Relay(settings.nostrSettings.nostrRelayUrl);

      await relay.connect();

      return relay;
    },
  });

  const localNostrKeys = createKeyPair();

  const metadataEvent = await getOrInsertCache(`${pubkey}:kind0`, () =>
    fetchOneEvent({
      log,
      relayFactory,
      filter: { authors: [pubkey], kinds: [0], limit: 1 },
    }),
  );

  log("metadataEvent", metadataEvent);

  const lnurlData = await getOrInsertCache(metadataEvent.id, () =>
    Either.getOrElseThrow({
      eitherFn: () => getZapEndpoint({ metadataEvent, log }),
    }),
  );

  const zapEndpoint = lnurlData.callback;
  const recipient = lnurlData.nostrPubkey;

  if (gui.gebid("n-modal-open-btn")) {
    return;
  }

  const { zapModal, closeModal } = zapModalComponent({
    user,
    metadataEvent,
    lnurlData,
    recipient,
    relayFactory,
    localNostrKeys,
    zapEndpoint,
    settings,
    log,
  });

  const zapModalOpen = html.button({
    id: "n-modal-open-btn",
    text: `⚡ Zap ${user} ⚡`,
    onclick: async () => {
      zapModal.style.display = "block";
    },
  });

  gui.prepend(
    document.querySelector("main"),
    html.div({
      classList: "n-button-container",
      children: [zapModalOpen, zapModal],
    }),
  );

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

githubProfilePage().catch((error) => console.log(error));
