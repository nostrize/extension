import browser from "webextension-polyfill";

import * as gui from "../../imgui-dom/gui.js";
import * as html from "../../imgui-dom/html.js";
import {
  getLocalSettings,
  getOrInsertCache,
} from "../../helpers/local-cache.js";
import { logger } from "../../helpers/logger.js";
import { delay, Either } from "../../helpers/utils.js";
import { zapModalComponent } from "../../components/zap-modal.js";
import { parseDescription } from "../../helpers/dom.js";
import { getMetadataEvent, getPubkeyFrom } from "../../helpers/nostr.js";
import { getRelays } from "../../helpers/relays.js";
import { getLnurlData } from "../../helpers/lnurl.js";
import { lightsatsModalComponent } from "../../components/lightsats/lightsats-modal.js";

async function twitterProfilePage() {
  const settings = await getLocalSettings();

  const log = logger({ ...settings.debug, namespace: "[N][X-Profile]" });

  const accountName = window.location.href.match(
    /^https:\/\/x\.com\/(.*?)(?=\?|\s|$)/,
  )[1];

  log("accountName", accountName);

  if (
    ["home", "explore", "notifications", "search?", "follower_requests"].some(
      (s) => accountName.startsWith(s),
    )
  ) {
    log("not a correct account page");

    return;
  }

  const existingTipButton = gui.gebid("n-tw-tip-button");

  if (existingTipButton) {
    log("zap button already there");

    if (existingTipButton.attributes["data-for-account"] !== accountName) {
      log("button doesn't belong to account", accountName);

      existingTipButton.parentElement.removeChild(existingTipButton);
    } else {
      log("don't need to load");

      return;
    }
  }

  let userNameContainer = document.querySelector("div[data-testid='UserName']");

  let accountDescContainer = document.querySelector(
    "div[data-testid='UserDescription']",
  );

  while (!(userNameContainer || accountDescContainer)) {
    await delay(200);

    userNameContainer = document.querySelector("div[data-testid='UserName']");

    accountDescContainer = document.querySelector(
      "div[data-testid='UserDescription']",
    );
  }

  const accountDescription = accountDescContainer
    ? [...accountDescContainer.querySelectorAll("span")]
        .map((m) => m.textContent)
        .join("")
    : "";

  const { nip05, npub } = parseDescription({
    content: accountDescription,
    log,
  });

  if (!npub && !nip05) {
    log("No Nostr integration found");

    if (
      settings.lightsatsSettings.enabled &&
      settings.lightsatsSettings.apiKey
    ) {
      const existingLightsatsButton = gui.gebid("n-tw-lightsats-button");

      if (existingLightsatsButton) {
        log("lightsats button already there");

        if (
          existingLightsatsButton.attributes["data-for-account"] !== accountName
        ) {
          log("button doesn't belong to account", accountName);

          existingLightsatsButton.parentElement.removeChild(
            existingLightsatsButton,
          );
        } else {
          log("don't need to load");

          return;
        }
      }

      const lightsatsButton = html.link({
        id: "n-tw-lightsats-button",
        data: [["for-account", accountName]],
        text: "💸 Lightsats💸",
        href: "javascript:void(0)",
        onclick: async () => {
          const { lightsatsModal, closeModal } = await lightsatsModalComponent({
            user: accountName,
            settings,
          });

          document.body.append(lightsatsModal);

          // Center the modal after appending it to the body
          centerModal(lightsatsModal);

          // Recenter the modal on window resize
          window.addEventListener("resize", () => centerModal(lightsatsModal));

          // When the user clicks anywhere outside of the modal, close it
          window.onclick = function (event) {
            if (event.target == lightsatsModal) {
              closeModal();
            }
          };

          // Listen for keydown events to close the modal when ESC is pressed
          window.addEventListener("keydown", function (event) {
            if (event.key === "Escape" || event.key === "Esc") {
              closeModal();
            }
          });

          lightsatsModal.style.display = "block";
        },
      });

      document
        .querySelector("div[data-testid='UserName']")
        .append(lightsatsButton);
    }

    return;
  }

  const pubkey = await getPubkeyFrom({
    nip05,
    npub,
    username: accountName,
    cachePrefix: "tw",
  });

  const relays = await html.asyncScript({
    id: "nostrize-nip07-provider",
    src: browser.runtime.getURL("nostrize-nip07-provider.js"),
    callback: () => getRelays({ settings, timeout: 4000 }),
  });

  log("relays", relays);

  const metadataEvent = await getMetadataEvent({
    cacheKey: pubkey,
    filter: { authors: [pubkey], kinds: [0], limit: 1 },
    relays,
  });

  const lnurlData = await getOrInsertCache({
    key: `nostrize-lnurldata-${metadataEvent.id}`,
    insertCallback: () =>
      Either.getOrElseThrow({
        eitherFn: () => getLnurlData({ metadataEvent, log }),
      }),
  });

  const zapButton = html.link({
    id: "n-tw-tip-button",
    data: [["for-account", accountName]],
    text: "⚡ Zap ⚡",
    href: "javascript:void(0)",
    onclick: async () => {
      const { zapModal, closeModal } = await zapModalComponent({
        user: accountName,
        metadataEvent,
        lnurlData,
        log,
        relays,
        settings,
      });

      document.body.append(zapModal);

      // Center the modal after appending it to the body
      centerModal(zapModal);

      // Recenter the modal on window resize
      window.addEventListener("resize", () => centerModal(zapModal));

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

      zapModal.style.display = "block";
    },
  });

  document.querySelector("div[data-testid='UserName']").append(zapButton);
}

function centerModal(modal) {
  const modalContent = modal.querySelector(".n-modal-content");
  const windowHeight = window.innerHeight;
  const modalHeight = modalContent.offsetHeight;

  if (modalHeight < windowHeight) {
    modalContent.style.marginTop = `${(windowHeight - modalHeight) / 2}px`;
  } else {
    modalContent.style.marginTop = "20px";
    modalContent.style.marginBottom = "20px";
  }
}

twitterProfilePage().catch((e) => console.error(e));
