import browser from "webextension-polyfill";

import * as html from "../../imgui-dom/html.js";
import * as gui from "../../imgui-dom/gui.js";
import { logger } from "../../helpers/logger.js";
import {
  getLocalSettings,
  getOrInsertCache,
} from "../../helpers/local-cache.js";
import { Either } from "../../helpers/utils.js";
import { zapModalComponent } from "../../components/zap-modal.js";
import { fetchFromNip05, getMetadataEvent } from "../../helpers/nostr.js";
import { getRelays } from "../../helpers/relays.js";
import { getLnurlData } from "../../helpers/lnurl.js";

async function githubProfilePage() {
  const settings = await getLocalSettings();

  const pathParts = window.location.pathname
    .split("/")
    .filter((part) => part.length > 0);

  // Assuming the URL pattern is https://github.com/{user}
  if (pathParts.length !== 1) {
    return;
  }

  if (gui.gebid("n-modal-open-btn")) {
    return;
  }

  const log = logger({ ...settings.debug, namespace: "[N][GH-Profile]" });
  const user = pathParts[0];

  const { pubkey } = await getOrInsertCache({
    key: `user_pubkey:${user}`,
    insertCallback: () =>
      Either.getOrElseThrow({
        eitherFn: async () => {
          log("trying to reach github connect nostr.json");
          // if the repo name is kept as the fork
          const res = await fetchFromNip05({
            user,
            fetchUrl: `https://${user}.github.io/github-connect/.well-known/nostr.json?user=${user}`,
          });

          if (Either.isRight(res)) {
            return res;
          }

          log(Either.getLeft(res));
          log("trying the short url version");

          // if the repo is renamed to [username].github.io
          return fetchFromNip05({
            user,
            fetchUrl: `https://${user}.github.io/.well-known/nostr.json?user=${user}`,
          });
        },
      }),
  });

  html.script({ src: browser.runtime.getURL("nostrize-nip07-provider.js") });

  const haveNip07Provider = true;

  const relays = await getRelays({
    settings,
    haveNip07Provider,
  });

  const metadataEvent = await getMetadataEvent({
    cacheKey: pubkey,
    filter: { authors: [pubkey], kinds: [0], limit: 1 },
    relays,
  });

  log("metadataEvent", metadataEvent);

  const lnurlData = await getOrInsertCache({
    key: metadataEvent.id,
    insertCallback: () =>
      Either.getOrElseThrow({
        eitherFn: () => getLnurlData({ metadataEvent, log }),
      }),
  });

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
        relays,
        lnurlData,
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
