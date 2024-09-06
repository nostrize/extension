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
  followAccount,
  getFollowSet,
  getMetadataEvent,
  getPubkeyFrom,
  getUserPubkey,
  unfollowAccount,
} from "../../helpers/nostr.js";
import {
  getAccountRelays,
  getNip07OrLocalRelays,
} from "../../helpers/relays.js";
import { getLnurlData } from "../../helpers/lnurl.js";
import { lightsatsModalComponent } from "../../components/lightsats/lightsats-modal.js";
import { wrapInputTooltip } from "../../components/tooltip/tooltip-wrapper.js";

import {
  addAccountNotesTab,
  createTwitterButton,
  updateFollowButton,
} from "./twitter-helpers.js";

async function twitterProfilePage() {
  const settings = await getLocalSettings();

  const log = logger({ ...settings.debug, namespace: "[N][X-Profile]" });

  const accountName = window.location.href.match(
    /^https:\/\/x\.com\/(.*?)(?=\?|\s|$)/,
  )[1];

  const removeNostrButtons = () => {
    gui.gebid("n-tw-zap-button")?.remove();
    gui.gebid("n-tw-lightsats-button")?.remove();
    gui.gebid("n-follows-you-indicator")?.remove();
    gui.gebid("n-tw-nostr-profile-button")?.remove();
    gui.gebid("n-tw-follow-unfollow-button")?.remove();
    gui.gebid("n-tw-account-notes")?.remove();
  };

  removeNostrButtons();

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
    log("not an account page: " + accountName);

    return;
  }

  log("accountName", accountName);

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

  const nip07UserPubkey = await html.asyncScript({
    id: "nostrize-nip07-provider",
    src: browser.runtime.getURL("nostrize-nip07-provider.js"),
    callback: () => getUserPubkey({ settings, timeout: 10000 }),
  });

  const buttonTobeCloned = document.querySelector(
    "button[data-testid='userActions']",
  );

  if (!buttonTobeCloned) {
    log("no copy button");

    return;
  }

  if (!npub && !nip05) {
    log("No Nostr integration found");

    if (
      settings.lightsatsSettings.enabled &&
      settings.lightsatsSettings.apiKey
    ) {
      const lightsatsButton = wrapInputTooltip({
        id: "n-tw-lightsats-button",
        input: createTwitterButton(buttonTobeCloned, accountName, {
          id: "n-tw-lightsats-button",
          emojiIcon: "💸",
          modalComponentFn: () =>
            lightsatsModalComponent({ user: accountName, settings }),
        }),
        tooltipText: `Orange pill ${accountName} with Lightning Network`,
      });

      gui.insertAfter(lightsatsButton, buttonTobeCloned);
    }

    return;
  }

  const accountPubkey = await getPubkeyFrom({
    nip05,
    npub,
    accountName,
    cachePrefix: "tw",
  });

  const nip07Relays = await getNip07OrLocalRelays({ settings, timeout: 4000 });

  const { readRelays, writeRelays } = await getAccountRelays({
    pubkey: accountPubkey,
    relays: nip07Relays,
  });

  console.log("writeRelays", writeRelays);

  // Account Notes
  addAccountNotesTab(
    accountPubkey,
    writeRelays,
    settings.nostrSettings.openNostr,
  );

  if (accountPubkey === nip07UserPubkey) {
    log("nip07 user");

    removeNostrButtons();

    return;
  }

  const metadataEvent = await getMetadataEvent({
    cacheKey: accountPubkey,
    filter: { authors: [accountPubkey], kinds: [0], limit: 1 },
    relays: nip07Relays,
  });

  // handle container is the div that contains the username and the handle
  const usernamePanel = document.querySelector("div[data-testid='UserName']");
  const handleContainer =
    usernamePanel?.childNodes[0]?.childNodes[0]?.childNodes[0]?.childNodes[1];
  const handle = handleContainer?.childNodes[0];
  const handleContent = handle.textContent;
  handle.style.display = "none";

  // nostr profile link
  if (handleContainer) {
    gui.prepend(
      handleContainer,
      wrapInputTooltip({
        id: "n-tw-nostr-profile-button",
        input: html.link({
          text: handleContent,
          href: `${settings.nostrSettings.openNostr}/${accountPubkey}`,
          targetBlank: true,
        }),
        tooltipText: `User is on Nostr. Click to open Nostr profile.`,
      }),
    );
  }

  // follows of the account
  const accountFollowSubscription = getFollowSet({
    pubkey: accountPubkey,
    relays: writeRelays,
    callback: ({ followSet }) => {
      const accountFollowsYou = followSet.has(nip07UserPubkey);

      log("accountFollowsYou", accountFollowsYou);

      if (accountFollowsYou) {
        handleContainer?.append(
          wrapInputTooltip({
            id: "n-follows-you-indicator",
            input: html.span({
              text: "Follows you",
              classList: "n-follows-you-indicator",
            }),
            tooltipText: `${accountName} follows you on Nostr.`,
          }),
        );
      }
    },
  });

  // follows of the user
  // the button to follow/unfollow
  getFollowSet({
    pubkey: nip07UserPubkey,
    relays: readRelays,
    timeout: 1000 * 60 * 10,
    callback: ({ followSet, latestEvent }) => {
      gui.gebid("n-tw-follow-unfollow-button")?.remove();

      let userFollowsAccount = followSet.has(accountPubkey);

      const button = wrapInputTooltip({
        id: "n-tw-follow-unfollow-button",
        input: createTwitterButton(buttonTobeCloned, accountName, {
          emojiIcon: userFollowsAccount ? "➖" : "➕",
          modalComponentFn: async () => {
            const followParams = {
              pubkey: nip07UserPubkey,
              currentFollowEvent: latestEvent,
              accountPubkey,
              accountWriteRelay: writeRelays[0],
              relays: nip07Relays,
              log,
            };

            button.disabled = true;

            updateFollowButton(gui.gebid("n-tw-follow-unfollow-button"), "⏳");

            try {
              if (userFollowsAccount) {
                await unfollowAccount(followParams);
              } else {
                await followAccount(followParams);
              }
            } catch (err) {
              alert("Nostrize error on follow/unfollow: " + err);
            }
          },
        }),
        tooltipText: `${userFollowsAccount ? "Unfollow" : "Follow"} ${accountName} on Nostr`,
      });

      gui.insertAfter(button, buttonTobeCloned);
    },
  });

  const lnurlData = await getOrInsertCache({
    key: `nostrize-lnurldata-${metadataEvent.id}`,
    insertCallback: () =>
      Either.getOrElseThrow({
        eitherFn: () => getLnurlData({ metadataEvent, log }),
      }),
  });

  const zapButton = wrapInputTooltip({
    id: "n-tw-zap-button",
    input: createTwitterButton(buttonTobeCloned, accountName, {
      id: "n-tw-zap-button",
      emojiIcon: "⚡️",
      modalComponentFn: () =>
        zapModalComponent({
          user: accountName,
          metadataEvent,
          relays: nip07Relays,
          lnurlData,
          log,
          settings,
        }),
    }),
    tooltipText: `Zap ${accountName}`,
  });

  gui.insertAfter(zapButton, buttonTobeCloned);

  accountFollowSubscription.close();
}

twitterProfilePage().catch((e) => console.error(e));
