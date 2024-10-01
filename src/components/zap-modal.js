import { SimplePool } from "nostr-tools";
import { makeZapRequest } from "nostr-tools/nip57";
import { toString as qrCode } from "qrcode/lib/browser.js";

import * as html from "../imgui-dom/html.js";
import * as gui from "../imgui-dom/gui.js";
import { milliSatsToSats, satsToMilliSats } from "../helpers/utils.js";
import { getMetadataEvent, getNostrizeUserPubkey } from "../helpers/nostr.js";
import { signEvent } from "../helpers/signer.js";
import { Either } from "../helpers/either.ts";

import { centerModal } from "./common.js";

export async function zapModalComponent({
  user,
  metadataEvent,
  nostrizeUserRelays,
  lnurlData,
  settings,
  log,
}) {
  const zapSatsAmountInput = html.input({
    type: "number",
    id: "n-zap-modal-amount",
    classList: "n-zap-modal-input",
    min: milliSatsToSats({ milliSats: lnurlData.minSendable }),
    max: milliSatsToSats({ milliSats: lnurlData.maxSendable }),
    placeholder: "Amount in sats",
    inputEventHandler: (e) => {
      const value = Number(e.target.value);

      if (value) {
        e.target.classList.remove("n-zap-input-error");
      }

      gui.gebid("n-zap-invoice-hidden").value = value;
    },
  });

  const getComment = async () => {
    if (settings.nostrSettings.mode === "anon") {
      return `Zapped with Nostrize anonymously`;
    }

    const nostrizeUserPubkeyEither = await getNostrizeUserPubkey({
      mode: settings.nostrSettings.mode,
      nostrConnectSettings: settings.nostrSettings.nostrConnect,
    });

    if (Either.isLeft(nostrizeUserPubkeyEither)) {
      return `Zapped with Nostrize anonymously`;
    }

    const nostrizeUserPubkey = Either.getRight(nostrizeUserPubkeyEither);

    const nostrizeUserMetadata = await getMetadataEvent({
      cacheKey: nostrizeUserPubkey,
      relays: nostrizeUserRelays.writeRelays,
      filter: { authors: [nostrizeUserPubkey], kinds: [0], limit: 1 },
    });

    let { display_name, name } = JSON.parse(nostrizeUserMetadata.content);

    const userName = display_name || name;

    return `Zapped with Nostrize by ${userName}`;
  };

  const commentInput = html.input({
    type: "text",
    id: "n-zap-modal-comment",
    classList: "n-zap-modal-input",
    placeholder: await getComment(),
  });

  const generateInvoiceButton = html.button({
    id: "n-zap-generate-invoice-btn",
    classList: "n-zap-generate-invoice-btn",
    text: "Generate Invoice",
    onclick: async (e) => {
      const amountInput = gui.gebid("n-zap-modal-amount");

      if (!amountInput.value) {
        amountInput.classList.add("n-zap-input-error");

        return e.preventDefault();
      }

      e.target.textContent = "Generating...";

      gui.gebid("n-zap-modal-step-2-desc").innerHTML =
        `Scan QR code to zap <span class="n-zap-span-red">${user}</span> ${zapSatsAmountInput.value} sats`;

      await generateInvoiceClick({
        sats: zapSatsAmountInput.value,
        comment: commentInput.value
          ? commentInput.value
          : commentInput.placeholder,
        lnurlData,
        log,
        metadataEvent,
        paidMessagePlaceholder,
        qrCode,
        qrCodeContainer,
        nostrizeUserRelays,
        nostrSettings: settings.nostrSettings,
        user,
      });
    },
  });

  const qrCodeContainer = html.div({
    id: "n-zap-modal-qr",
    classList: "n-zap-modal-qr",
  });

  const paidMessagePlaceholder = html.div({
    id: "n-zap-modal-paid-msg",
    classList: "n-zap-modal-paid-msg",
    text: "",
  });

  const copyInvoiceButtonHandler = (e) => {
    window.focus();

    const invoice = document.getElementById("n-zap-invoice-hidden").text;

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

    document.getElementById("n-zap-generate-invoice-btn").textContent =
      "Generate Invoice";
    document.getElementById("n-zap-modal-step-1").style.display = "block";
    document.getElementById("n-zap-modal-step-2").style.display = "none";
    document.getElementById("n-zap-modal-step-3").style.display = "none";
  };

  const zapModal = html.div({
    id: "n-zap-modal",
    classList: "n-zap-modal",
    children: [
      html.div({
        id: "n-zap-modal-content",
        classList: "n-modal-content n-zap-modal-content",
        children: [
          html.span({
            classList: "n-zap-modal-close",
            text: "×",
            onclick: closeModal,
          }),
          html.div({
            id: "n-zap-modal-step-1",
            children: [
              html.h2({
                classList: "n-zap-modal-title",
                innerHTML: `Zap <span class="n-zap-span-red">${user}</span> using a lightning wallet ${settings.nostrSettings.mode === "anon" ? "anonymously" : ""}`,
              }),
              html.div({
                children: [21, 69, 100, 500].map(satOptionButton),
                classList: "n-zap-sats-option-row",
              }),
              html.div({
                children: [2100, 6900, 10000, 20000].map(satOptionButton),
                classList: "n-zap-sats-option-row",
              }),
              html.div({
                classList: "n-zap-sats-option-row",
                children: [zapSatsAmountInput],
              }),
              html.div({
                classList: "n-zap-sats-option-row",
                children: [commentInput],
              }),
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
            id: "n-zap-modal-step-2",
            children: [
              html.span({
                id: "n-zap-modal-step-2-desc",
              }),
              qrCodeContainer,
              html.input({ type: "hidden", id: "n-zap-invoice-hidden" }),
              html.div({
                id: "n-zap-modal-copy-container",
                classList: "n-zap-modal-copy-container",
                children: [
                  html.button({
                    id: "n-zap-modal-copy-btn",
                    classList: "n-zap-modal-copy-btn",
                    text: "Copy invoice",
                    onclick: copyInvoiceButtonHandler,
                  }),
                ],
              }),
            ],
          }),
          html.div({
            id: "n-zap-modal-step-3",
            children: [paidMessagePlaceholder],
          }),
        ],
      }),
    ],
  });

  return { modal: zapModal, closeModal };
}

async function generateInvoiceClick({
  sats,
  comment,
  log,
  lnurlData,
  metadataEvent,
  paidMessagePlaceholder,
  qrCode,
  qrCodeContainer,
  nostrizeUserRelays,
  nostrSettings,
  user,
}) {
  const milliSats = satsToMilliSats({ sats });

  const eventTemplate = await makeZapRequest({
    profile: metadataEvent.pubkey,
    amount: milliSats,
    comment,
    relays: nostrizeUserRelays.readRelays,
  });

  let zapRequestEvent;

  zapRequestEvent = await signEvent({
    mode: nostrSettings.mode,
    eventTemplate,
    nostrConnectSettings: nostrSettings.nostrConnect,
  });

  if (!zapRequestEvent) {
    throw new Error("not implemented");
  }

  log("zapRequestEvent", zapRequestEvent);

  const zapEndpoint = lnurlData.callback;
  const receiptAuthor = lnurlData.nostrPubkey;

  const url = `${zapEndpoint}?amount=${milliSats}&nostr=${encodeURIComponent(
    JSON.stringify(zapRequestEvent),
  )}&comment=${encodeURIComponent(comment)}`;

  const res = await fetch(url);
  const { pr: invoice } = await res.json();

  log("invoice", invoice);

  document.getElementById("n-zap-invoice-hidden").text = invoice;

  const svg = await qrCode(invoice, {
    type: "svg",
  });

  qrCodeContainer.innerHTML = svg;

  document.getElementById("n-zap-modal-step-1").style.display = "none";
  document.getElementById("n-zap-modal-step-2").style.display = "flex";

  centerModal(document.getElementById("n-zap-modal"));

  const zapReceiptEvent = await getZapReceipt({
    relays: nostrizeUserRelays.readRelays,
    filter: {
      authors: [receiptAuthor],
      kinds: [9735],
      "#p": [metadataEvent.pubkey],
      since: zapRequestEvent.created_at - 20,
      limit: 1,
    },
    bolt11: invoice,
    log,
  });

  log("zapReceiptEvent", zapReceiptEvent);

  paidMessagePlaceholder.innerHTML = `⚡ You just zapped <span class="n-zap-span-red">${user}</span> ${sats} sats ⚡`;

  document.getElementById("n-zap-modal-step-2").style.display = "none";
  document.getElementById("n-zap-modal-step-3").style.display = "flex";

  centerModal(document.getElementById("n-zap-modal"));
}

const createSatsOptionButton = (button) => (sats) => {
  return button({
    text: `⚡ ${sats}`,
    classList: "n-zap-sats-option-btn",
    onclick: () => {
      const amountInput = gui.gebid("n-zap-modal-amount");

      amountInput.value = sats;

      // Manually trigger the input event
      const event = new Event("input", {
        bubbles: true,
        cancelable: true,
      });

      amountInput.dispatchEvent(event);
    },
  });
};

async function getZapReceipt({ relays, filter, bolt11, log }) {
  const pool = new SimplePool();

  return new Promise((resolve) => {
    log("zap receipt filter", filter);

    const subscription = pool.subscribeMany(relays, [filter], {
      onevent(event) {
        const found = event.tags.find(
          (t) => t[0] === "bolt11" && t[1] === bolt11,
        );

        if (found) {
          resolve(event);

          subscription.close();
        }
      },
    });
  });
}
