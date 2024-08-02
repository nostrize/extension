import { finalizeEvent, Relay } from "nostr-tools";
import { makeZapRequest } from "nostr-tools/nip57";
import { toString as qrCode } from "qrcode/lib/browser.js";

import { logger } from "../../../helpers/logger.js";
import {
  getLocalSettings,
  getOrInsertCache,
} from "../../../helpers/local-cache.js";
import {
  fetchFromNip05,
  getZapEndpoint,
  generateInvoiceButtonClick,
  createSatsOptionButton,
} from "./profile-helper.js";
import { fetchOneEvent } from "../../../helpers/relays.js";
import { createKeyPair } from "../../../helpers/crypto.js";
import * as html from "../../../imgui-dom/html.js";
import * as gui from "../../../imgui-dom/gui.js";
import {
  singletonFactory,
  Either,
  milliSatsToSats,
} from "../../../helpers/utils.js";

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

  const zapModalOpen = html.button({
    id: "n-modal-open-btn",
    text: `⚡ Zap ${user} ⚡`,
    onclick: async () => {
      zapModal.style.display = "block";
    },
  });

  const zapSatsAmountInput = html.input({
    type: "number",
    id: "n-modal-amount",
    classList: "n-modal-input",
    value: 21,
    min: milliSatsToSats(lnurlData.minSendable),
    max: milliSatsToSats(lnurlData.maxSendable),
    placeholder: "Amount in sats",
    onchange: (e) => (gui.gebid("n-invoice-hidden").value = e.target.value),
  });

  const getComment = () => {
    if (!settings.nostrSettings.useNostrAnon) {
      throw new Error("not implemented");
    }

    return `Zapped with Nostrize by Anon`;
  };

  const commentInput = html.input({
    type: "text",
    id: "n-modal-comment",
    classList: "n-modal-input",
    placeholder: getComment(),
  });

  const generateInvoiceButton = html.button({
    id: "n-generate-invoice-btn",
    classList: "n-generate-invoice-btn",
    text: "Generate Invoice",
    onclick: async (e) => {
      e.target.textContent = "Generating...";

      gui.gebid("n-modal-step-2-desc").textContent =
        `Scan QR code to zap ${user} ${zapSatsAmountInput.value} sats`;

      await generateInvoiceButtonClickHandler();
    },
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

  const copyInvoiceButtonHandler = (e) => {
    window.focus();

    const invoice = document.getElementById("n-invoice-hidden").text;

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
  };

  const satOptionButton = createSatsOptionButton(html.button);

  const closeModal = () => {
    zapModal.style.display = "none";

    document.getElementById("n-generate-invoice-btn").textContent =
      "Generate Invoice";
    document.getElementById("n-modal-step-1").style.display = "block";
    document.getElementById("n-modal-step-2").style.display = "none";
    document.getElementById("n-modal-step-3").style.display = "none";
  };

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
            onclick: closeModal,
          }),
          html.div({
            id: "n-modal-step-1",
            children: [
              html.h2({
                classList: "n-modal-title",
                text: `Zap ${user} using a lightning wallet ${settings.nostrSettings.useNostrAnon ? "anonymously" : ""}`,
              }),
              html.div({
                children: [21, 69, 100, 500].map(satOptionButton),
                classList: "n-sats-option-row",
              }),
              html.div({
                children: [2100, 5000, 10000, 100000].map(satOptionButton),
                classList: "n-sats-option-row",
              }),
              html.div({
                classList: "n-sats-option-row",
                children: [zapSatsAmountInput, html.span({ text: "sats" })],
              }),
              commentInput,
              html.div({
                style: [
                  ["display", "flex"],
                  ["justify-content", "center"],
                  ["aligh-items", "center"],
                ],
                children: [generateInvoiceButton],
              }),
            ],
          }),
          html.div({
            id: "n-modal-step-2",
            children: [
              html.span({
                id: "n-modal-step-2-desc",
              }),
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
                    onclick: copyInvoiceButtonHandler,
                  }),
                ],
              }),
            ],
          }),
          html.div({
            id: "n-modal-step-3",
            children: [paidMessagePlaceholder],
          }),
        ],
      }),
    ],
  });

  const generateInvoiceButtonClickHandler = () =>
    generateInvoiceButtonClick({
      sats: zapSatsAmountInput.value,
      comment: commentInput.value
        ? commentInput.value
        : commentInput.placeholder,
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
      nostrSettings: settings.nostrSettings,
      nip46: { localNostrKeys },
      user,
      zapEndpoint,
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
