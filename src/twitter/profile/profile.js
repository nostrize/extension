import { Relay } from "nostr-tools";

import * as gui from "../../imgui-dom/gui.js";
import * as html from "../../imgui-dom/html.js";
import {
  getLocalSettings,
  getOrInsertCache,
} from "../../helpers/local-cache.js";
import { logger } from "../../helpers/logger.js";
import { delay, Either, singletonFactory } from "../../helpers/utils.js";
import {
  getZapEndpoint,
  zapModalComponent,
} from "../../components/zap-modal.js";
import { fetchOneEvent } from "../../helpers/relays.js";
import { createKeyPair } from "../../helpers/crypto.js";
import { parseDescription } from "../../helpers/dom.js";
import { getPubkeyFrom } from "../../helpers/nostr.js";

async function twitterProfilePage() {
  const settings = await getLocalSettings();

  let accountNameContainer = document.querySelector(
    "div[data-testid='UserName']",
  );

  while (accountNameContainer == null) {
    await delay(500);

    accountNameContainer = document.querySelector(
      "div[data-testid='UserName']",
    );
  }

  if (gui.gebid("n-tw-tip-button")) {
    return;
  }

  const accountName =
    accountNameContainer.querySelector("span span").textContent;

  const accountDescription = document.querySelector(
    "div[data-testid='UserDescription'] span",
  ).textContent;

  const { nip05, npub } = parseDescription({ content: accountDescription });

  const log = logger({ ...settings.debug, namespace: "[N][X-Profile]" });

  const pubkey = await getPubkeyFrom({
    nip05,
    npub,
    username: accountName,
    cachePrefix: "tw",
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
    user: accountName,
    metadataEvent,
    lnurlData,
    localNostrKeys,
    log,
    recipient,
    relayFactory,
    settings,
    zapEndpoint,
  });

  accountNameContainer.append(
    html.link({
      id: "n-tw-tip-button",
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

twitterProfilePage().catch((e) => console.error(e));
