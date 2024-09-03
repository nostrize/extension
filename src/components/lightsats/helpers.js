import { toString as qrCode } from "qrcode/lib/browser.js";

import * as html from "../../imgui-dom/html.js";

export const wallets = [
  { id: "", name: "None" },
  { id: "wos", name: "Wallet Of Satoshi" },
  { id: "muun", name: "Muun Wallet" },
  { id: "breez", name: "Breez Wallet" },
  { id: "alby", name: "Alby Wallet" },
  { id: "phoenix", name: "Phoenix" },
  { id: "lntips", name: "lntips (Telegram)" },
  { id: "obw", name: "OBW" },
  { id: "blink", name: "Blink" },
  { id: "lifpay", name: "LifPay" },
  { id: "mutiny", name: "Mutiny" },
  { id: "zeus", name: "Zeus" },
  { id: "zebedee", name: "ZEBEDEE" },
  { id: "blixt", name: "Blixt" },
  { id: "strike", name: "Strike" },
  { id: "cashapp", name: "Cash App" },
  { id: "pouch", name: "Pouch" },
];

export const shortenText = (maxLengthStart, maxLengthEnd, text) => {
  if (text.length > maxLengthStart + maxLengthEnd) {
    return text.slice(0, maxLengthStart) + "..." + text.slice(-maxLengthEnd);
  }
  return text;
};

export const tipUrl = (tipId) => `https://lightsats.com/tips/${tipId}`;
export const claimUrl = (tipId) => `${tipUrl(tipId)}/claim`;
export const tipIdKey = (user) => `tw-${user}-lightsats-tip-id`;

export function determineStep(status) {
  switch (status) {
    case "UNFUNDED":
      return 2;
    case "UNSEEN":
      return 3;
    case "SEEN":
    case "CLAIMED":
    case "WITHDRAWN":
      return 4;
    default:
      return -1;
  }
}

export function displayStepError(modalStep0) {
  modalStep0.innerHTML = "";

  modalStep0.append(
    html.h2({
      classList: "n-modal-title",
      text: "Error fetching tip information",
    }),
    html.div({
      style: [["display", "block"]],
      children: [
        html.span({
          innerHTML:
            "Please try again later. If the error persists, please contact <a href='https://x.com/nostrize'>Support</a>",
        }),
      ],
    }),
  );
}

export function displayStep1(modalStep0, modalStep1) {
  modalStep1.innerHTML = "";

  modalStep0.style.display = "none";
  modalStep1.style.display = "flex";
}

export async function displayStep2(
  tip,
  modalStep2,
  previousSteps,
  qrCodeContainer,
) {
  qrCodeContainer.innerHTML = await qrCode(`lightning:${tip.invoice}`);

  modalStep2.innerHTML = "";
  modalStep2.append(
    html.h2({
      classList: "n-modal-title",
      text: `Fund this wallet with your lightning wallet`,
    }),
    qrCodeContainer,
    html.span({
      text: "Waiting for invoice to be funded...",
    }),
    html.br(),
    html.link({
      classList: "n-modal-title-link",
      href: tipUrl(tip.id),
      text: "Lightsats link to your tip",
      targetBlank: true,
    }),
  );

  previousSteps.forEach((step) => {
    step.style.display = "none";
  });

  modalStep2.style.display = "flex";
}

export async function displayStep3(
  tip,
  modalStep3,
  previousSteps,
  qrCodeContainer,
) {
  qrCodeContainer.innerHTML = await qrCode(claimUrl(tip.id));

  const commonItems = [
    html.li({
      text: "Share the tip URL or QR code publicly by mentioning your friend in a post",
    }),
    html.li({
      text: "Share the passphrase privately",
    }),
  ];

  const descriptionList = html.div({
    style: [
      ["display", "flex"],
      ["flexDirection", "column"],
      ["alignItems", "center"],
      ["gap", "1rem"],
    ],
    children: [
      html.h3({
        text: "🔗 Let's see how to share the tip URL with the recipient.",
      }),
      html.div({
        children: [
          html.span({ text: "👉 " }),
          html.span({
            text: "(easy) You can show the QR code to your friend.",
          }),
        ],
      }),
      html.div({
        style: [
          ["textAlign", "center"],
          ["width", "50%"],
        ],
        children: [qrCodeContainer],
      }),
      html.div({
        children: [
          html.span({ text: "👉 " }),
          html.span({
            text: "(easy) You can copy the URL and share it in a private chat.",
          }),
        ],
      }),
      html.div({
        classList: "n-tip-url-container",
        style: [
          ["display", "flex"],
          ["justifyContent", "center"],
          ["alignItems", "center"],
        ],
        children: [
          html.link({
            href: claimUrl(tip.id),
            text: shortenText(20, 15, claimUrl(tip.id)),
            classList: "n-modal-title-link",
            targetBlank: true,
          }),
          createCopyButton(claimUrl(tip.id)),
        ],
      }),
      html.div({
        children: [
          html.span({ text: "👉 " }),
          html.span({ text: "(advanced) You can also:" }),
          html.ul({
            children: tip.passphrase
              ? commonItems
              : [
                  html.li({
                    innerHTML: `First <a href="${tipUrl(tip.id)}">set a passphrase</a> if you didn't already`,
                  }),
                  ...commonItems,
                ],
          }),
        ],
      }),
    ],
  });

  if (tip.passphrase) {
    descriptionList.append(
      html.div({
        style: [
          ["display", "flex"],
          ["alignItems", "center"],
          ["gap", "0.5rem"],
          ["border", "1px solid #ccc"],
          ["padding", "0.5rem"],
          ["borderRadius", "4px"],
          ["backgroundColor", "#8dff0047"],
        ],
        children: [
          html.span({ text: `Generated passphrase: ${tip.passphrase}` }),
          createCopyButton(tip.passphrase),
        ],
      }),
    );
  }

  modalStep3.innerHTML = "";
  modalStep3.append(
    html.h2({
      classList: "n-modal-title",
      text: `🎉 Your tip is funded! Now you can share the tip URL with the recipient. 🎁`,
    }),
    descriptionList,
  );

  previousSteps.forEach((step) => {
    step.style.display = "none";
  });

  modalStep3.style.display = "flex";
}

export function displayStep4(tip, modalStep4, previousSteps) {
  let message;

  switch (tip.status) {
    case "SEEN":
      message = "Your tip has been seen 👀";
      break;
    case "CLAIMED":
      message = "Your tip has been claimed 🎉";
      break;
    case "WITHDRAWN":
      message = "Your tip has been withdrawn 💸";
      break;
    default:
      throw new Error(`Unexpected tip status: ${tip.status}`);
  }

  modalStep4.innerHTML = "";
  modalStep4.append(
    html.h2({
      classList: "n-modal-title",
      text: message,
    }),
    html.link({
      classList: "n-modal-title-link",
      href: tipUrl(tip.id),
      text: "Link to your tip",
      targetBlank: true,
    }),
  );

  previousSteps.forEach((step) => {
    step.style.display = "none";
  });

  modalStep4.style.display = "flex";
}

export function getTipInfo(tipId, apiKey) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: "get-tip",
        url: `https://lightsats.com/api/tipper/tips/${tipId}`,
        method: "GET",
        apiKey,
      },
      (response) => {
        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error));
        }
      },
    );
  });
}

function createCopyButton(textToCopy) {
  const link = html.link({
    classList: "n-copy-button",
    href: "javascript:void(0)",
    text: "📋",
    style: [["textDecoration", "none"]],
    onclick: () => {
      navigator.clipboard.writeText(textToCopy);

      link.textContent = "✅";

      setTimeout(() => {
        link.textContent = "📋";
      }, 2000);
    },
  });

  return link;
}
