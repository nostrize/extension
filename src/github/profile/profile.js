import browser from "webextension-polyfill";

import * as html from "../../imgui-dom/html.js";
import * as gui from "../../imgui-dom/gui.js";
import { logger } from "../../helpers/logger.js";
import {
  getNostrizeSettings,
  getOrInsertPageCache,
} from "../../helpers/local-cache.js";
import { Either, uniqueArrays } from "../../helpers/utils.js";
import { zapModalComponent } from "../../components/zap-modal.js";
import { getMetadataEvent, getPubkeyFrom } from "../../helpers/nostr.js";
import { getNostrizeUserRelays } from "../../helpers/relays.js";
import { getLnurlData } from "../../helpers/lnurl.js";
import { getGithubConnectData } from "../github-connect.js";
import { parseDescription } from "../../helpers/dom.js";
import { setupModal } from "../../components/common.js";

async function githubProfilePage() {
  const settings = await getNostrizeSettings();

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

  const githubConnectData = await getOrInsertPageCache({
    key: `nostrize-github-connect-${user}`,
    insertCallback: () =>
      getGithubConnectData({ user, log }).then(Either.getOrElse(null)),
    skipEmpty: true,
  });

  let pageUserPubkey;

  if (githubConnectData) {
    pageUserPubkey = githubConnectData.pubkey;
  } else {
    const bio = document.querySelector(".user-profile-bio").textContent;

    const { nip05, npub } = parseDescription({ content: bio, log });

    const canLoad = nip05 || npub;

    if (!canLoad) {
      log(`could not parse nip05 or npub for user: ${user}`);

      return;
    }

    pageUserPubkey = await getPubkeyFrom({
      nip05,
      npub,
      pageUsername: user,
      cachePrefix: "github",
    });

    log("pubkey", pageUserPubkey);
  }

  await html.asyncScript({
    id: "nostrize-nip07-provider",
    src: browser.runtime.getURL("nostrize-nip07-provider.js"),
  });

  const nostrizeUserRelays = await getNostrizeUserRelays({
    settings,
    timeout: 4000,
  });

  const metadataEvent = await getMetadataEvent({
    cacheKey: pageUserPubkey,
    filter: { authors: [pageUserPubkey], kinds: [0], limit: 1 },
    relays: uniqueArrays(
      nostrizeUserRelays.readRelays,
      nostrizeUserRelays.writeRelays,
    ),
  });

  log("metadataEvent", metadataEvent);

  const lnurlData = await getOrInsertPageCache({
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
      const { modal, closeModal } = await zapModalComponent({
        user,
        metadataEvent,
        nostrizeUserRelays,
        lnurlData,
        settings,
        log,
      });

      setupModal(modal, closeModal);
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
