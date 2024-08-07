import browser from "webextension-polyfill";

import * as html from "../../imgui-dom/html.js";
import * as gui from "../../imgui-dom/gui.js";
import { logger } from "../../helpers/logger.js";
import {
  getLocalSettings,
  getOrInsertCache,
} from "../../helpers/local-cache.js";
import { fetchOneEvent, getRelayFactory } from "../../helpers/relays.js";
import { Either } from "../../helpers/utils.js";
import { getLnurlData, zapModalComponent } from "../../components/zap-modal.js";
import { fetchFromNip05 } from "../../helpers/nostr.js";

async function githubProfilePage() {
  const settings = await getLocalSettings();

  const pathParts = window.location.pathname
    .split("/")
    .filter((part) => part.length > 0);

  // Assuming the URL pattern is https://github.com/{user}
  if (pathParts.length !== 1) {
    return;
  }

  const log = logger({ ...settings.debug, namespace: "[N][GH-Profile]" });
  const user = pathParts[0];

  const fetchUrl = `https://${user}.github.io/github-connect/.well-known/nostr.json`;

  const { pubkey } = await getOrInsertCache(`user_pubkey:${user}`, () =>
    Either.getOrElseThrow({
      eitherFn: () => fetchFromNip05({ user, fetchUrl }),
    }),
  );

  html.script({ src: browser.runtime.getURL("nostrize-nip07-provider.js") });

  const relayFactory = getRelayFactory({
    relays: settings.nostrSettings.relays,
  });

  const metadataEvent = await getOrInsertCache(`${pubkey}:kind0`, () =>
    fetchOneEvent({
      relayFactory,
      filter: { authors: [pubkey], kinds: [0], limit: 1 },
    }),
  );

  log("metadataEvent", metadataEvent);

  const lnurlData = await getOrInsertCache(metadataEvent.id, () =>
    Either.getOrElseThrow({
      eitherFn: () => getLnurlData({ metadataEvent, log }),
    }),
  );

  if (gui.gebid("n-modal-open-btn")) {
    return;
  }

  const tipButton = html.button({
    id: "n-modal-open-btn",
    text: `⚡ Zap ${user} ⚡`,
    onclick: async () => {
      const { zapModal, closeModal } = await zapModalComponent({
        user,
        metadataEvent,
        lnurlData,
        relayFactory,
        settings,
        log,
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

  gui.prepend(
    document.querySelector("main"),
    html.div({
      classList: "n-button-container",
      children: [tipButton],
    }),
  );
}

githubProfilePage().catch((error) => console.log(error));
