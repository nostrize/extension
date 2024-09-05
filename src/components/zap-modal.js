import { finalizeEvent, SimplePool } from "nostr-tools";
import { makeZapRequest } from "nostr-tools/nip57";
import { toString as qrCode } from "qrcode/lib/browser.js";

import * as html from "../imgui-dom/html.js";
import * as gui from "../imgui-dom/gui.js";
import { milliSatsToSats, satsToMilliSats } from "../helpers/utils.js";
import { createKeyPair } from "../helpers/crypto.js";
import { getMetadataEvent, requestSigningFromNip07 } from "../helpers/nostr.js";
import { centerModal } from "./common.js";

export async function zapModalComponent({
  user,
  metadataEvent,
  relays,
  lnurlData,
  settings,
  log,
}) {
  const zapSatsAmountInput = html.input({
    type: "number",
    id: "n-modal-amount",
    classList: "n-modal-input",
    min: milliSatsToSats({ milliSats: lnurlData.minSendable }),
    max: milliSatsToSats({ milliSats: lnurlData.maxSendable }),
    placeholder: "Amount in sats",
    inputEventHandler: (e) => {
      const value = Number(e.target.value);

      if (value) {
        e.target.classList.remove("n-input-error");
      }

      gui.gebid("n-invoice-hidden").value = value;
    },
  });

  const getComment = async () => {
    if (settings.nostrSettings.mode === "anon") {
      return `Zapped with Nostrize anonymously`;
    } else if (settings.nostrSettings.mode === "nip07") {
      const nip07Pubkey = await getPubkeyFromNip07();

      const nip07Kind0 = await getMetadataEvent({
        cacheKey: nip07Pubkey,
        relays,
        filter: { authors: [nip07Pubkey], kinds: [0], limit: 1 },
      });

      let { display_name, name } = JSON.parse(nip07Kind0.content);

      const nip07Name = display_name || name;

      return `Zapped with Nostrize by ${nip07Name}`;
    }

    throw new Error("Not implemented");
  };

  const commentInput = html.input({
    type: "text",
    id: "n-modal-comment",
    classList: "n-modal-input",
    placeholder: await getComment(),
  });

  const generateInvoiceButton = html.button({
    id: "n-generate-invoice-btn",
    classList: "n-generate-invoice-btn",
    text: "Generate Invoice",
    onclick: async (e) => {
      const amountInput = gui.gebid("n-modal-amount");

      if (!amountInput.value) {
        amountInput.classList.add("n-input-error");

        return e.preventDefault();
      }

      e.target.textContent = "Generating...";

      gui.gebid("n-modal-step-2-desc").innerHTML =
        `Scan QR code to zap <span class="n-span-red">${user}</span> ${zapSatsAmountInput.value} sats`;

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
        relays,
        nostrSettings: settings.nostrSettings,
        user,
      });
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
                innerHTML: `Zap <span class="n-span-red">${user}</span> using a lightning wallet ${settings.nostrSettings.mode === "anon" ? "anonymously" : ""}`,
              }),
              html.div({
                children: [21, 69, 100, 500].map(satOptionButton),
                classList: "n-sats-option-row",
              }),
              html.div({
                children: [2100, 6900, 10000, 20000].map(satOptionButton),
                classList: "n-sats-option-row",
              }),
              html.div({
                classList: "n-sats-option-row",
                children: [zapSatsAmountInput],
              }),
              html.div({
                classList: "n-sats-option-row",
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

  return { modal: zapModal, closeModal };
}

async function getPubkeyFromNip07() {
  window.postMessage({
    from: "nostrize",
    type: "nip07-pubkey-request",
  });

  return new Promise((resolve) => {
    window.addEventListener("message", function (event) {
      if (event.source !== window) {
        return;
      }

      const { from, type, pubkey } = event.data;

      if (
        !(
          from === "nostrize-nip07-provider" &&
          type === "nip07-pubkey-request" &&
          !!pubkey
        )
      ) {
        return;
      }

      return resolve(pubkey);
    });
  });
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
  relays,
  nostrSettings,
  user,
}) {
  const milliSats = satsToMilliSats({ sats });

  const eventTemplate = await makeZapRequest({
    profile: metadataEvent.pubkey,
    amount: milliSats,
    comment,
    relays,
  });

  let zapRequestEvent;

  if (nostrSettings.mode === "anon") {
    const localNostrKeys = createKeyPair();

    zapRequestEvent = finalizeEvent(eventTemplate, localNostrKeys.secret);
  } else if (nostrSettings.mode === "nip07") {
    zapRequestEvent = await requestSigningFromNip07({
      from: "nostrize",
      type: "nip07-sign-request",
      eventTemplate,
    });
  } else if (nostrSettings.mode === "bunker") {
    throw new Error("Not implemented");
  }

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

  document.getElementById("n-invoice-hidden").text = invoice;

  const svg = await qrCode(invoice, {
    type: "svg",
  });

  qrCodeContainer.innerHTML = svg;

  document.getElementById("n-modal-step-1").style.display = "none";
  document.getElementById("n-modal-step-2").style.display = "flex";

  centerModal(document.getElementById("n-modal"));

  const zapReceiptEvent = await getZapReceipt({
    relays,
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

  paidMessagePlaceholder.innerHTML = `⚡ You just zapped <span class="n-span-red">${user}</span> ${sats} sats ⚡`;

  document.getElementById("n-modal-step-2").style.display = "none";
  document.getElementById("n-modal-step-3").style.display = "flex";

  centerModal(document.getElementById("n-modal"));
}

const createSatsOptionButton = (button) => (sats) => {
  return button({
    text: `⚡ ${sats}`,
    classList: "n-sats-option-btn",
    onclick: () => {
      const amountInput = gui.gebid("n-modal-amount");

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
