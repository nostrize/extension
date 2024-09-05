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

import { createTwitterButton } from "./twitter-helpers.js";

// Watch user handle for changes
// AccountName is from the URL

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
      createTwitterButton(buttonTobeCloned, accountName, {
        id: "n-tw-lightsats-button",
        icon: "💸",
        modalComponentFn: () =>
          lightsatsModalComponent({ user: accountName, settings }),
      });
    }

    return;
  }

  const accountPubkey = await getPubkeyFrom({
    nip05,
    npub,
    accountName,
    cachePrefix: "tw",
  });

  if (accountPubkey === nip07UserPubkey) {
    log("nip07 user");

    removeNostrButtons();

    return;
  }

  const nip07Relays = await getNip07OrLocalRelays({ settings, timeout: 4000 });

  const metadataEvent = await getMetadataEvent({
    cacheKey: accountPubkey,
    filter: { authors: [accountPubkey], kinds: [0], limit: 1 },
    relays: nip07Relays,
  });

  const { readRelays, writeRelays } = await getAccountRelays({
    pubkey: accountPubkey,
    relays: nip07Relays,
  });

  const usernamePanel = document.querySelector("div[data-testid='UserName']");

  const handleContainer =
    usernamePanel?.childNodes[0]?.childNodes[0]?.childNodes[0]?.childNodes[1];

  const handle = handleContainer?.childNodes[0];

  const handleContent = handle.textContent;

  handle.style.display = "none";

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

  // TODO: handle errors: how?

  const userFollowsCallback = ({ followSet, latestEvent }) => {
    const userFollowsAccount = followSet.has(accountPubkey);

    // TODO: put the icons in the twitter buttons
    const followIcon = wrapInputTooltip({
      input: html.span({
        text: userFollowsAccount ? "👤➡️" : "➕👤",
        classList: "n-follow-icon",
        style: [["cursor", "pointer"]],
        onclick: async () => {
          log("unfollowing");

          let newFollowSet;
          let newLatestEvent;

          if (userFollowsAccount) {
            const newFollowResult = await unfollowAccount({
              pubkey: nip07UserPubkey,
              currentFollowEvent: latestEvent,
              accountPubkey,
              relays: nip07Relays,
              log,
            });

            newFollowSet = newFollowResult.followSet;
            newLatestEvent = newFollowResult.latestEvent;
          } else {
            const newFollowResult = await followAccount({
              pubkey: nip07UserPubkey,
              currentFollowEvent: latestEvent,
              accountPubkey,
              relays: nip07Relays,
              log,
            });

            newFollowSet = newFollowResult.followSet;
            newLatestEvent = newFollowResult.latestEvent;
          }

          followIcon.remove();

          userFollowsCallback({
            followSet: newFollowSet,
            latestEvent: newLatestEvent,
          });
        },
      }),
      tooltipText: userFollowsAccount
        ? `You follow ${accountName} on Nostr. Click to unfollow.`
        : `You don't follow ${accountName} on Nostr. Click to follow.`,
    });
  };

  // follows of the user
  const userFollowsSubscription = getFollowSet({
    pubkey: nip07UserPubkey,
    relays: readRelays,
    callback: userFollowsCallback,
  });

  const lnurlData = await getOrInsertCache({
    key: `nostrize-lnurldata-${metadataEvent.id}`,
    insertCallback: () =>
      Either.getOrElseThrow({
        eitherFn: () => getLnurlData({ metadataEvent, log }),
      }),
  });

  createTwitterButton(buttonTobeCloned, accountName, {
    id: "n-tw-zap-button",
    icon: "⚡️",
    modalComponentFn: () =>
      zapModalComponent({
        user: accountName,
        metadataEvent,
        relays: nip07Relays,
        lnurlData,
        log,
        settings,
      }),
  });

  accountFollowSubscription.close();
  userFollowsSubscription.close();
}

twitterProfilePage().catch((e) => console.error(e));
