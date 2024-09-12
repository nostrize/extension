import browser from "webextension-polyfill";

import * as gui from "../imgui-dom/gui.js";
import * as html from "../imgui-dom/html.js";

import { getLocalSettings, getOrInsertCache } from "../helpers/local-cache.js";
import { logger } from "../helpers/logger.js";
import { getPageUserRelays } from "../helpers/relays.js";
import { parseDescription } from "../helpers/dom.js";
import { getMetadataEvent, getPubkeyFrom } from "../helpers/nostr.js";
import { Either } from "../helpers/utils.js";
import { getLnurlData } from "../helpers/lnurl.js";
import { zapModalComponent } from "../components/zap-modal.js";
import { setupModal } from "../components/common.js";

async function telegramBio() {
  const settings = await getLocalSettings();

  const log = logger({ ...settings.debug, namespace: "[N][Telegram-Web]" });

  const tipButtonId = "n-telegram-web-tip-button";

  let existingTipButton = gui.gebid(tipButtonId);

  if (existingTipButton) {
    log("zap button already there");

    return;
  }

  const ce = document.querySelector(".ChatExtra");

  let username;
  let bio;
  let usernameDom;

  if (!ce) {
    return;
  }

  ce.querySelectorAll(".ListItem").forEach((li) => {
    const mli = li.querySelector(".ListItem-button .multiline-item");

    if (!mli) {
      return;
    }

    const subtitle = mli.querySelector(".subtitle").textContent;

    if (subtitle === "Username") {
      username = mli.querySelector(".title").textContent;
      usernameDom = li;
    } else if (subtitle === "Bio") {
      bio = mli.querySelector("span").textContent;
    }
  });

  if (!username) {
    log("username is not defined");

    return;
  }

  if (!bio) {
    log(`bio is not defined for user: ${username}`);

    return;
  }

  const { nip05, npub } = parseDescription({ content: bio, log });

  const canLoad = nip05 || npub;

  if (!canLoad) {
    log(`could not parse nip05 or npub for user: ${username}`);

    return;
  }

  const accountPubkey = await getPubkeyFrom({
    nip05,
    npub,
    pageUsername: username,
    cachePrefix: "telegram-web",
  });

  log("pubkey", accountPubkey);

  const accountRelays = await html.asyncScript({
    id: "nostrize-nip07-provider",
    src: browser.runtime.getURL("nostrize-nip07-provider.js"),
    callback: () => getPageUserRelays({ pubkey: accountPubkey, settings }),
  });

  log("relays", accountRelays);

  const metadataEvent = await getMetadataEvent({
    cacheKey: accountPubkey,
    filter: { authors: [accountPubkey], kinds: [0], limit: 1 },
    relays: accountRelays,
  });

  const lnurlData = await getOrInsertCache({
    key: `nostrize-lnurldata-${metadataEvent.id}`,
    insertCallback: () =>
      Either.getOrElseThrow({
        eitherFn: () => getLnurlData({ metadataEvent, log }),
      }),
  });

  const tipButton = html.link({
    id: tipButtonId,
    data: [["for-account", username]],
    classList: "n-bio-zap-button",
    text: "⚡Tip⚡",
    href: "javascript:void(0);",
    onclick: async () => {
      const { modal, closeModal } = await zapModalComponent({
        user: username,
        metadataEvent,
        lnurlData,
        log,
        relays: accountRelays,
        settings,
      });

      setupModal(modal, closeModal);
    },
  });

  existingTipButton = gui.gebid(tipButtonId);

  if (existingTipButton) {
    log("zap button already there");

    return;
  }

  log("putting zap button to dom");
  gui.prepend(usernameDom, tipButton);
}

telegramBio().catch((e) => console.log(e));
