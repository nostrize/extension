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
import { getMetadataEvent, getPubkeyFrom } from "../../helpers/nostr.js";
import { getNip07OrLocalRelays } from "../../helpers/relays.js";
import { getLnurlData } from "../../helpers/lnurl.js";
import { getGithubConnectData } from "../github-connect.js";
import { parseDescription } from "../../helpers/dom.js";

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

  const githubConnectData = await getOrInsertCache({
    key: `nostrize-github-connect-${user}`,
    insertCallback: () =>
      getGithubConnectData({ user, log }).then(Either.getOrElse(null)),
    skipEmpty: true,
  });

  let pubkey;

  if (githubConnectData) {
    pubkey = githubConnectData.pubkey;
  } else {
    const bio = document.querySelector(".user-profile-bio").textContent;

    const { nip05, npub } = parseDescription({ content: bio, log });

    const canLoad = nip05 || npub;

    if (!canLoad) {
      log(`could not parse nip05 or npub for user: ${user}`);

      return;
    }

    pubkey = await getPubkeyFrom({
      nip05,
      npub,
      accountName: user,
      cachePrefix: "github",
    });

    log("pubkey", pubkey);
  }

  const relays = await html.asyncScript({
    id: "nostrize-nip07-provider",
    src: browser.runtime.getURL("nostrize-nip07-provider.js"),
    callback: () => getNip07OrLocalRelays({ settings, timeout: 4000 }),
  });

  log("relays", relays);

  const metadataEvent = await getMetadataEvent({
    cacheKey: pubkey,
    filter: { authors: [pubkey], kinds: [0], limit: 1 },
    relays,
  });

  log("metadataEvent", metadataEvent);

  const lnurlData = await getOrInsertCache({
    key: `nostrize-metadata-${metadataEvent.id}`,
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
