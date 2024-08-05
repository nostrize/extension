import { finalizeEvent } from "nostr-tools";
import { makeZapRequest } from "nostr-tools/nip57";
import { toString as qrCode } from "qrcode/lib/browser.js";

import * as html from "../imgui-dom/html.js";
import * as gui from "../imgui-dom/gui.js";
import {
  Either,
  generateRandomHexString,
  milliSatsToSats,
  satsToMilliSats,
} from "../helpers/utils.js";
import { fetchOneEvent } from "../helpers/relays.js";

export function zapModalComponent({
  user,
  metadataEvent,
  lnurlData,
  recipient,
  relayFactory,
  localNostrKeys,
  zapEndpoint,
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
      const amountInput = gui.gebid("n-modal-amount");

      if (!amountInput.value) {
        amountInput.classList.add("n-input-error");

        return e.preventDefault();
      }

      e.target.textContent = "Generating...";

      gui.gebid("n-modal-step-2-desc").innerHTML =
        `Scan QR code to zap <span class="n-span-red">${user}</span> ${zapSatsAmountInput.value} sats`;

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
                innerHTML: `Zap <span class="n-span-red">${user}</span> using a lightning wallet ${settings.nostrSettings.useNostrAnon ? "anonymously" : ""}`,
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

  return { zapModal, closeModal };
}

export async function generateInvoiceButtonClick({
  sats,
  comment,
  fetchOneEvent,
  finalizeEvent,
  log,
  makeZapRequest,
  metadataEvent,
  paidMessagePlaceholder,
  qrCode,
  qrCodeContainer,
  recipient,
  relayFactory,
  nostrSettings,
  nip46,
  user,
  zapEndpoint,
}) {
  const milliSats = satsToMilliSats({ sats });

  // will be used for querying
  const randomEventIndex = generateRandomHexString(64);

  const eventTemplate = await makeZapRequest({
    profile: metadataEvent.pubkey,
    event: randomEventIndex,
    amount: milliSats,
    comment,
    relays: [nostrSettings.nostrRelayUrl],
  });

  // sign zap event anonymously for now
  // TODO: experiment with NIP-46
  const zapRequestEvent = nostrSettings.useNostrAnon
    ? finalizeEvent(eventTemplate, nip46.localNostrKeys.secret)
    : null;

  if (!zapRequestEvent) {
    throw new Error("not implemented");
  }

  log("zapRequestEvent", zapRequestEvent);

  const url = `${zapEndpoint}?amount=${milliSats}&nostr=${encodeURIComponent(
    JSON.stringify(zapRequestEvent),
  )}&comment=${encodeURIComponent(comment)}`;

  const res = await fetch(url);
  const { pr: invoice } = await res.json();

  document.getElementById("n-invoice-hidden").text = invoice;

  const svg = await qrCode(invoice, {
    type: "svg",
  });

  qrCodeContainer.innerHTML = svg;

  document.getElementById("n-modal-step-1").style.display = "none";
  document.getElementById("n-modal-step-2").style.display = "flex";

  const zapReceiptEvent = await fetchOneEvent({
    relayFactory,
    log,
    filter: {
      authors: [recipient],
      kinds: [9735],
      "#p": [metadataEvent.pubkey],
      "#e": [randomEventIndex],
      limit: 1,
    },
  });

  log("zapReceiptEvent", zapReceiptEvent);

  paidMessagePlaceholder.innerHTML = `⚡ You just zapped <span class="n-span-red">${user}</span> ${sats} sats ⚡`;

  document.getElementById("n-modal-step-2").style.display = "none";
  document.getElementById("n-modal-step-3").style.display = "flex";
}

export const createSatsOptionButton = (button) => (sats) => {
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

export async function getZapEndpoint({ metadataEvent, log }) {
  try {
    let { lud16 } = JSON.parse(metadataEvent.content);

    if (lud16) {
      const [name, domain] = lud16.split("@");

      const lnurl = new URL(
        `/.well-known/lnurlp/${name}`,
        `https://${domain}`,
      ).toString();

      const res = await fetch(lnurl);
      const body = await res.json();

      log(`fetch ${lnurl}`, body);

      if (body.allowsNostr && body.nostrPubkey) {
        return Either.right(body);
      } else {
        return Either.left("allowsNostr or nostrPubkey is not present");
      }
    } else {
      return Either.left("Could not find lud16 from kind0 event");
    }
  } catch (err) {
    return Either.left(err.toString());
  }
}
