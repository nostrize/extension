import { finalizeEvent, Relay } from "nostr-tools";
import { makeZapRequest } from "nostr-tools/nip57";
import { toString as qrCode } from "qrcode/lib/browser.js";

import { logger } from "../../../helpers/logger.js";
import { getOrInsertCache } from "../../../helpers/local-cache.js";
import {
  fetchNpubFromNip05,
  getZapEndpoint,
  zapButtonOnClick,
} from "./helper.js";
import { fetchOneEvent } from "../../../helpers/relays.js";
import * as html from "../../../imgui-dom/src/html.js";
import * as gui from "../../../imgui-dom/src/gui.js";
import {
  singletonFactory,
  Either,
  milliSatsToSats,
} from "../../../helpers/utils.js";

async function githubProfilePage() {
  const { settings } = await chrome.storage.sync.get(["settings"]);

  settings.debug.namespace = "[N][Profile]";

  const pathParts = window.location.pathname
    .split("/")
    .filter((part) => part.length > 0);

  // Assuming the URL pattern is https://github.com/{user}
  if (pathParts.length !== 1) {
    return;
  }

  const log = logger(settings.debug);

  const user = pathParts[0];
  const npub = await getOrInsertCache(`user_npub:${user}`, () =>
    fetchNpubFromNip05({ user, log }),
  );

  if (!npub) {
    log(`could not fetch user ${user}`);

    return;
  }

  // TODO: get it from settings
  const relayUrl = "wss://relay.damus.io";

  // TODO: use SimplePool, do we need multiple relays?
  const relayFactory = singletonFactory({
    factoryAsyncFn: async () => {
      const relay = new Relay(relayUrl);

      await relay.connect();

      return relay;
    },
  });

  const metadataEvent = await getOrInsertCache(`npub_kid0:${npub}`, () =>
    fetchOneEvent({
      relayFactory,
      filter: { authors: [npub], kinds: [0], limit: 1 },
    }),
  );

  log("metadataEvent", metadataEvent);

  const lnurlData = await getOrInsertCache(metadataEvent.id, () =>
    Either.getOrElseThrow(() => getZapEndpoint({ metadataEvent, log })),
  );

  const zapEndpoint = lnurlData.callback;
  const recipient = lnurlData.nostrPubkey;

  const zapModalOpen = html.button({
    id: "n-modal-open-btn",
    text: `⚡ Zap ${user} ⚡`,
    onclick: async () => {
      zapModal.style.display = "block";

      await zapButtonClickEventHandler();
    },
  });

  const zapSatsAmountInput = html.input({
    type: "number",
    id: "n-modal-amount",
    classList: "n-modal-input",
    value: 21,
    min: milliSatsToSats(lnurlData.minSendable),
    max: milliSatsToSats(lnurlData.maxSendable),
  });

  const qrCodeContainer = html.div({
    id: "n-modal-qr",
    classList: "n-modal-qr",
  });

  const paidMessagePlaceholder = html.div({
    id: "n-modal-paid-msg",
    classList: "n-modal-paid-msg",
    text: "",
  });

  const zapModal = html.div({
    id: "n-modal",
    classList: "n-modal",
    children: [
      html.div({
        id: "n-modal-content",
        classList: "n-modal-content",
        children: [
          html.span({
            classList: "n-modal-close",
            text: "×",
            onclick: () => (zapModal.style.display = "none"),
          }),
          html.div({
            id: "n-modal-hide-after-pay",
            children: [
              html.h2({
                classList: "n-modal-title",
                text: "Zap with a lightning wallet",
              }),
              zapSatsAmountInput,
              qrCodeContainer,
              html.input({ type: "hidden", id: "n-invoice-hidden" }),
              html.div({
                id: "n-modal-copy-container",
                classList: "n-modal-copy-container",
                children: [
                  html.button({
                    id: "n-modal-copy-btn",
                    classList: "n-modal-copy-btn",
                    text: "Copy invoice",
                    onclick: (e) => {
                      window.focus();

                      const invoice =
                        document.getElementById("n-invoice-hidden").text;

                      navigator.clipboard.writeText(invoice).then(() => {
                        // Change button text to "Copied" and set it to green
                        e.target.textContent = "Copied";
                        e.target.classList.add("copied");

                        // Change it back to "Copy invoice" after 3 seconds
                        setTimeout(() => {
                          e.target.textContent = "Copy invoice";
                          e.target.classList.remove("copied");
                        }, 3000);
                      });
                    },
                  }),
                ],
              }),
            ],
          }),
          paidMessagePlaceholder,
        ],
      }),
    ],
  });

  gui.prepend(
    document.querySelector("main"),
    html.div({
      classList: "n-button-container",
      children: [zapModalOpen, zapModal],
    }),
  );

  const zapButtonClickEventHandler = () =>
    zapButtonOnClick({
      sats: zapSatsAmountInput.value,
      comment: "Zapped from Nostrize",
      html,
      fetchOneEvent,
      finalizeEvent,
      gui,
      lnurlData,
      log,
      makeZapRequest,
      metadataEvent,
      paidMessagePlaceholder,
      qrCode,
      qrCodeContainer,
      recipient,
      relayFactory,
      relayUrl,
      user,
      zapEndpoint,
    });

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == zapModal) {
      zapModal.style.display = "none";
    }
  };

  // Listen for keydown events to close the modal when ESC is pressed
  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape" || event.key === "Esc") {
      zapModal.style.display = "none";
    }
  });
}

githubProfilePage().catch((error) => console.log(error));
