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

async function twitterProfilePage() {
  const settings = await getLocalSettings();

  const log = logger({ ...settings.debug, namespace: "[N][X-Profile]" });

  const accountName = window.location.href.match(
    /^https:\/\/x\.com\/(.*?)(?=\?|\s|$)/,
  )[1];

  log("accountName", accountName);

  if (
    ["home", "explore", "notifications", "search?"].some((s) =>
      accountName.startsWith(s),
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

  let accountDescContainer = document.querySelector(
    "div[data-testid='UserDescription']",
  );

  while (!accountDescContainer) {
    await delay(200);

    accountDescContainer = document.querySelector(
      "div[data-testid='UserDescription']",
    );
  }

  const accountDescription = [...accountDescContainer.querySelectorAll("span")]
    .map((m) => m.textContent)
    .join("");

  if (!accountDescription) {
    log("accountDescription is not in the dom");

    return;
  }

  const { nip05, npub } = parseDescription({
    content: accountDescription,
    log,
  });

  if (!npub && !nip05) {
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

  const tipButton = html.link({
    id: "n-tw-tip-button",
    data: [["for-account", accountName]],
    text: "⚡Tip⚡",
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

  document.querySelector("div[data-testid='UserName']").append(tipButton);
}

twitterProfilePage().catch((e) => console.error(e));
