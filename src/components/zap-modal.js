import { finalizeEvent } from "nostr-tools";
import { makeZapRequest } from "nostr-tools/nip57";
import { toString as qrCode } from "qrcode/lib/browser.js";

import * as html from "../imgui-dom/html.js";
import * as gui from "../imgui-dom/gui.js";
import { Either, milliSatsToSats, satsToMilliSats } from "../helpers/utils.js";
import { fetchOneEvent } from "../helpers/relays.js";
import { createKeyPair } from "../helpers/crypto.js";
import { getOrInsertCache } from "../helpers/local-cache.js";

export async function zapModalComponent({
  user,
  metadataEvent,
  lnurlData,
  relayFactory,
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
    if (settings.nostrSettings.useNostrAnon) {
      return `Zapped with Nostrize`;
    }

    if (settings.nostrSettings.useNip07Signing) {
      const nip07Pubkey = await getPubkeyFromNip07();

      const nip07Kind0 = await getOrInsertCache(`${nip07Pubkey}:kind0`, () =>
        fetchOneEvent({
          relayFactory,
          filter: { authors: [nip07Pubkey], kinds: [0], limit: 1 },
        }),
      );

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
      lnurlData,
      log,
      metadataEvent,
      paidMessagePlaceholder,
      qrCode,
      qrCodeContainer,
      relayFactory,
      nostrSettings: settings.nostrSettings,
      user,
    });

  return { zapModal, closeModal };
}

async function getPubkeyFromNip07() {
  window.postMessage({
    from: "nostrize-zap-modal",
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

async function requestSigningFromNip07(messageParams) {
  window.postMessage(messageParams);

  return new Promise((resolve) => {
    window.addEventListener("message", function (event) {
      if (event.source !== window) {
        return;
      }

      const { from, type, signedEvent } = event.data;

      if (
        !(
          from === "nostrize-nip07-provider" &&
          type === "nip07-sign-request" &&
          !!signedEvent
        )
      ) {
        return;
      }

      return resolve(signedEvent);
    });
  });
}

export async function generateInvoiceButtonClick({
  sats,
  comment,
  log,
  lnurlData,
  metadataEvent,
  paidMessagePlaceholder,
  qrCode,
  qrCodeContainer,
  relayFactory,
  nostrSettings,
  user,
}) {
  const milliSats = satsToMilliSats({ sats });

  const eventTemplate = await makeZapRequest({
    profile: metadataEvent.pubkey,
    amount: milliSats,
    comment,
    relays: [nostrSettings.nostrRelayUrl],
  });

  let zapRequestEvent;

  if (nostrSettings.useNostrAnon) {
    const localNostrKeys = createKeyPair();

    zapRequestEvent = finalizeEvent(eventTemplate, localNostrKeys.secret);
  } else if (nostrSettings.useNip07Signing) {
    zapRequestEvent = await requestSigningFromNip07({
      from: "nostrize-zap-modal",
      type: "nip07-sign-request",
      eventTemplate,
    });
  } else if (nostrSettings.useBunker) {
    throw new Error("Not implemented");
  } else if (nostrSettings.useWebln) {
    throw new Error("Not implemented");
  }

  if (!zapRequestEvent) {
    throw new Error("not implemented");
  }

  log("zapRequestEvent", zapRequestEvent);

  const zapEndpoint = lnurlData.callback;
  const recipient = lnurlData.nostrPubkey;

  const url = `${zapEndpoint}?amount=${milliSats}&nostr=${encodeURIComponent(
    JSON.stringify(zapRequestEvent),
  )}&comment=${encodeURIComponent(comment)}`;

  const since = Math.floor(Date.now() / 1000);

  console.log(`since seconds: ${since}`);

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
    bolt11: invoice,
    filter: {
      authors: [recipient],
      kinds: [9735],
      "#p": [metadataEvent.pubkey],
      since,
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

export async function getLnurlData({ metadataEvent, log }) {
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
