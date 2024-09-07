import * as html from "../../imgui-dom/html.js";
import * as gui from "../../imgui-dom/gui.js";
import { getFromCache, insertToCache } from "../../helpers/local-cache.js";

import {
  determineStep,
  displayStep1,
  displayStep2,
  displayStep3,
  displayStep4,
  displayStepError,
  claimUrl,
  tipIdKey,
  wallets,
  getTipInfo,
} from "./helpers.js";
import { wrapCheckbox } from "../checkbox/checkbox-wrapper.js";

// Create a loading screen element
let modalStep0 = html.div({
  classList: "n-ls-modal-steps n-ls-modal-step-0",
  children: [
    html.h2({
      classList: "n-ls-modal-title",
      text: "Loading tip information...",
    }),
    html.div({
      classList: "n-ls-modal-loading-spinner",
    }),
  ],
});

const modalStep1 = html.div({
  classList: "n-ls-modal-steps n-ls-modal-step-1",
  children: [],
});

const modalStep2 = html.div({
  classList: "n-ls-modal-steps n-ls-modal-step-2",
  children: [],
});

const modalStep3 = html.div({
  classList: "n-ls-modal-steps n-ls-modal-step-3",
  children: [],
});

const modalStep4 = html.div({
  classList: "n-ls-modal-steps n-ls-modal-step-4",
  children: [],
});

const qrCodeContainer = html.div({
  id: "n-ls-modal-qr",
  classList: "n-ls-modal-qr",
});

function updateModalStep(newStep, tip, qrCodeContainer, apiKey) {
  if (newStep === 1) {
    displayStep1(modalStep0, modalStep1);
  } else if (newStep === 2) {
    const fetchTip = setInterval(async () => {
      tip = await getTipInfo(tip.id, apiKey);

      if (tip.status === "FUNDED") {
        clearInterval(fetchTip);

        displayStep3(
          tip,
          modalStep3,
          [modalStep1, modalStep2],
          qrCodeContainer,
          modalStep0,
        );
      }
    }, 2000);

    displayStep2(tip, modalStep2, [modalStep0, modalStep1], qrCodeContainer);
  } else if (newStep === 3) {
    displayStep3(
      tip,
      modalStep3,
      [modalStep0, modalStep1],
      qrCodeContainer,
      modalStep0,
    );
  } else if (newStep === 4) {
    displayStep4(tip, modalStep4, [
      modalStep0,
      modalStep1,
      modalStep2,
      modalStep3,
    ]);
  } else if (newStep === -1) {
    displayStepError(modalStep0);
  }
}

export async function lightsatsModalComponent({ user, settings }) {
  const tipId = getFromCache(tipIdKey(user));
  let tip;
  let step = 1;

  // Initialize step as 0 (loading state)
  step = 0;

  // Display the loading screen
  updateModalStep(0, null, null);

  if (tipId) {
    try {
      tip = await getTipInfo(tipId, settings.lightsatsSettings.apiKey);

      console.log("Tip:", tip);

      step = determineStep(tip.status);

      updateModalStep(step, tip, qrCodeContainer);
    } catch (error) {
      console.error("Error fetching tip:", error);

      updateModalStep(-1, null, null);
    }
  } else {
    // If there's no tipId, we can proceed to step 1
    step = 1;
    updateModalStep(1, null, null);
  }

  const tipExpiryInput = html.input({
    type: "number",
    id: "n-ls-modal-tip-expiry",
    classList: "n-ls-modal-input",
    min: 1,
    value: 5,
    placeholder: "Tip expiry (in days)",
  });

  const tipAmountInput = html.input({
    type: "number",
    id: "n-ls-modal-tip-amount",
    classList: "n-ls-modal-input",
    min: 1,
    value: 210,
    placeholder: "Tip amount (in sats)",
  });

  const onboardingFlowSelect = html.select({
    id: "n-ls-modal-onboarding-flow",
    classList: "n-ls-modal-input",
    options: [
      { value: "lightning", text: "Lightning", selected: true },
      { value: "standard", text: "Standard" },
      { value: "skip", text: "Skip" },
    ],
  });

  const recommendedWalletSelect = html.select({
    id: "n-ls-modal-recommended-wallet",
    classList: "n-ls-modal-input",
    options: wallets.map((wallet) => ({
      value: wallet.id,
      text: wallet.name,
    })),
  });

  const recipientNameInput = html.input({
    type: "text",
    id: "n-ls-modal-recipient-name",
    classList: "n-ls-modal-input",
    placeholder: user,
  });

  const noteToRecipientInput = html.textarea({
    id: "n-ls-modal-note-to-recipient",
    classList: "n-ls-modal-input",
    placeholder: "Note to recipient",
    rows: 3,
  });

  const generateTipButton = html.button({
    id: "n-ls-generate-tip-btn",
    classList: "n-ls-modal-button",
    text: "Generate Tip",
    onclick: async () => {
      const days = parseInt(tipExpiryInput.value);
      const timestamp = Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;

      generateTipButton.textContent = "Generating...";
      generateTipButton.disabled = true;
      generateTipButton.classList.add("n-ls-modal-button-disabled");

      const generatePassphrase = gui.gebid("n-ls-modal-tip-passphrase").checked;

      // Send a message to the service worker
      chrome.runtime.sendMessage(
        {
          action: "create-tip",
          url: "https://lightsats.com/api/tipper/tips",
          method: "POST",
          apiKey: settings.lightsatsSettings.apiKey,
          payload: {
            amount: parseInt(tipAmountInput.value),
            quantity: 1,
            expiry: new Date(timestamp * 1000).toISOString(),
            onboardingFlow: onboardingFlowSelect.value.toUpperCase(),
            tippeeName: recipientNameInput.value
              ? recipientNameInput.value
              : user,
            note: noteToRecipientInput.value,
            generatePassphrase: generatePassphrase,
            passphraseLength: generatePassphrase ? 3 : undefined,
          },
        },
        async (response) => {
          console.log("Response from service worker:", response);

          if (response.success) {
            console.log("Tip generated:", response.data);

            document.querySelector(".n-ls-modal-step-1").style.display = "none";
            document.querySelector(".n-ls-modal-step-2").style.display = "flex";

            tip = response.data;

            insertToCache(tipIdKey(user), tip.id);

            const fetchTip = setInterval(async () => {
              tip = await getTipInfo(tip.id, settings.lightsatsSettings.apiKey);

              if (tip.status === "UNSEEN") {
                clearInterval(fetchTip);

                displayStep3(
                  tip,
                  modalStep3,
                  [modalStep1, modalStep2],
                  qrCodeContainer,
                  modalStep0,
                );
              }
            }, 2000);

            displayStep2(
              tip,
              modalStep2,
              [modalStep0, modalStep1],
              qrCodeContainer,
            );
          } else {
            console.error("Error generating tip:", response.error);

            displayStepError(modalStep0);
          }
        },
      );
    },
  });

  const copyTipUrlButton = html.button({
    id: "n-ls-modal-copy-tip-url-btn",
    classList: "n-ls-modal-button",
    text: "Copy Tip URL",
    onclick: () => {
      navigator.clipboard.writeText(claimUrl(tip.id));
      copyTipUrlButton.textContent = "Copied!";
    },
  });

  const tipPassphraseCheckbox = wrapCheckbox({
    input: html.input({
      type: "checkbox",
      id: "n-ls-modal-tip-passphrase",
    }),
    text: "Generate a passphrase",
  });

  modalStep1.append(
    html.h2({
      classList: "n-ls-modal-title",
      innerHTML: `Onboard <span style="color: red;">${user}</span> to the Lightning Network with <a href="https://lightsats.com" class="n-ls-modal-title-link" target="_blank">Lightsats</a>`,
    }),
    html.fieldset(
      html.legend("Tip Settings"),
      html.div({
        classList: "n-ls-sats-option-row",
        children: html.labelFor({
          input: tipExpiryInput,
          classList: "n-ls-modal-tip-expiry",
          text: "Tip expiry (in days)",
        }),
      }),
      html.div({
        classList: "n-ls-sats-amount-row",
        children: html.labelFor({
          input: tipAmountInput,
          classList: "n-ls-modal-tip-amount",
          text: "Tip amount (in sats)",
        }),
      }),
      html.div({
        classList: "n-ls-sats-option-row",
        children: html.labelFor({
          input: onboardingFlowSelect,
          classList: "n-ls-modal-onboarding-flow",
          text: "Onboarding flow",
        }),
      }),
      html.div({
        classList: "n-ls-sats-option-row",
        children: html.labelFor({
          input: recommendedWalletSelect,
          classList: "n-ls-modal-recommended-wallet",
          text: "Recommended wallet",
        }),
      }),
      html.div({
        classList: "n-ls-sats-option-row",
        children: [tipPassphraseCheckbox],
      }),
    ),
    html.fieldset(
      html.legend("Recipient Settings"),
      html.div({
        classList: "n-ls-sats-option-row",
        children: html.labelFor({
          input: recipientNameInput,
          classList: "n-ls-modal-recipient-name",
          text: "Recipient name",
        }),
      }),
      html.div({
        classList: "n-ls-sats-option-row",
        children: html.labelFor({
          input: noteToRecipientInput,
          classList: "n-ls-modal-note-to-recipient",
          text: "Note to recipient",
        }),
      }),
    ),
    html.div({
      classList: "n-ls-sats-button-row",
      children: [generateTipButton],
    }),
  );

  const lightsatsModal = html.div({
    id: "n-ls-modal",
    classList: "n-ls-modal",
    children: [
      html.div({
        id: "n-ls-modal-content",
        classList: "n-ls-modal-content n-modal-content",
        children: [
          html.span({
            classList: "n-ls-modal-close",
            text: "×",
            onclick: () => closeModal(),
          }),
          modalStep0,
          modalStep1,
          modalStep2,
          modalStep3,
          modalStep4,
        ],
      }),
    ],
  });

  const closeModal = () => {
    lightsatsModal.style.display = "none";

    lightsatsModal.remove();
  };

  return { modal: lightsatsModal, closeModal };
}
