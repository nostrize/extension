import browser from "webextension-polyfill";
import * as gui from "../../imgui-dom/gui.js";
import * as html from "../../imgui-dom/html.js";
import {
  getLocalSettings,
  getOrInsertCache,
} from "../../helpers/local-cache.js";
import { logger } from "../../helpers/logger.js";
import { delay, Either } from "../../helpers/utils.js";
import { getLnurlData, zapModalComponent } from "../../components/zap-modal.js";
import { fetchOneEvent, getRelayFactory } from "../../helpers/relays.js";
import { parseDescription } from "../../helpers/dom.js";
import { getPubkeyFrom } from "../../helpers/nostr.js";

async function twitterProfilePage() {
  const settings = await getLocalSettings();

  const log = logger({ ...settings.debug, namespace: "[N][X-Profile]" });

  let accountNameContainer = document.querySelector(
    "div[data-testid='UserName']",
  );

  while (accountNameContainer == null) {
    await delay(500);

    accountNameContainer = document.querySelector(
      "div[data-testid='UserName']",
    );
  }

  if (gui.gebid("n-tw-tip-button")) {
    log("zap button already there, don't need to load");

    return;
  }

  html.script({ src: browser.runtime.getURL("nostrize-nip07-provider.js") });

  const accountName =
    accountNameContainer.querySelector("span span").textContent;

  const accountDescription = [
    ...document.querySelectorAll("div[data-testid='UserDescription'] span"),
  ]
    .map((m) => m.textContent)
    .join("");

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

  const relayFactory = getRelayFactory({
    relays: settings.nostrSettings.relays,
  });

  const metadataEvent = await getOrInsertCache(`${pubkey}:kind0`, () =>
    fetchOneEvent({
      relayFactory,
      filter: { authors: [pubkey], kinds: [0], limit: 1 },
    }),
  );

  const lnurlData = await getOrInsertCache(metadataEvent.id, () =>
    Either.getOrElseThrow({
      eitherFn: () => getLnurlData({ metadataEvent, log }),
    }),
  );

  const tipButton = html.link({
    id: "n-tw-tip-button",
    text: "⚡Tip⚡",
    href: "javascript:void(0)",
    onclick: async () => {
      const { zapModal, closeModal } = await zapModalComponent({
        user: accountName,
        metadataEvent,
        lnurlData,
        log,
        relayFactory,
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

  accountNameContainer.append(tipButton);
}

twitterProfilePage().catch((e) => console.error(e));
