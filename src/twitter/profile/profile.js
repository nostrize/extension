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
import {
  getMetadataEvent,
  getPubkeyFrom,
  getUserPubkey,
} from "../../helpers/nostr.js";
import { getRelays } from "../../helpers/relays.js";
import { getLnurlData } from "../../helpers/lnurl.js";
import { lightsatsModalComponent } from "../../components/lightsats/lightsats-modal.js";
import { setupModal } from "../../components/common.js";

async function twitterProfilePage() {
  const settings = await getLocalSettings();

  const log = logger({ ...settings.debug, namespace: "[N][X-Profile]" });

  const accountName = window.location.href.match(
    /^https:\/\/x\.com\/(.*?)(?=\?|\s|$)/,
  )[1];

  log("accountName", accountName);

  let hasZapButton = false;
  let hasLightsatsButton = false;

  // remove zap and lightsats button if they are not for this account
  document.querySelectorAll("[data-for-account]").forEach((e) => {
    if (e.attributes["data-for-account"] !== accountName) {
      e.remove();
    } else {
      if (e.id === "n-tw-zap-button") {
        hasZapButton = true;
      }

      if (e.id === "n-tw-lightsats-button") {
        hasLightsatsButton = true;
      }
    }
  });

  if (
    [
      "home",
      "explore",
      "notifications",
      "messages",
      "search",
      "follower_requests",
    ].some((s) => accountName.startsWith(s))
  ) {
    log("not an account page");

    return;
  }

  if (hasZapButton) {
    log("don't need to load");

    return;
  }

  if (hasLightsatsButton) {
    log("don't need to load");

    return;
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

  const {
    nip05,
    npub,
    pubkey: pubk,
  } = parseDescription({
    content: accountDescription,
    log,
  });

  const userPubkey = await html.asyncScript({
    id: "nostrize-nip07-provider",
    src: browser.runtime.getURL("nostrize-nip07-provider.js"),
    callback: () => getUserPubkey({ settings, timeout: 10000 }),
  });

  if (pubk === userPubkey) {
    log("logged in user");

    gui.gebid("n-tw-zap-button")?.remove();
    gui.gebid("n-tw-lightsats-button")?.remove();

    return;
  }

  if (!npub && !nip05) {
    log("No Nostr integration found");

    if (
      settings.lightsatsSettings.enabled &&
      settings.lightsatsSettings.apiKey
    ) {
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

          setupModal(lightsatsModal, closeModal);
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

  const relays = await getRelays({ settings, timeout: 4000 });

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
    id: "n-tw-zap-button",
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

      setupModal(zapModal, closeModal);
    },
  });

  document.querySelector("div[data-testid='UserName']").append(zapButton);
}

twitterProfilePage().catch((e) => console.error(e));
