import browser from "webextension-polyfill";

import * as gui from "../../imgui-dom/gui.js";
import * as html from "../../imgui-dom/html.js";
import { getOrInsertPageCache } from "../../helpers/local-cache.js";
import { logger } from "../../helpers/logger.js";
import { delay } from "../../helpers/utils.js";
import { Either } from "../../helpers/either.ts";
import { zapModalComponent } from "../../components/zap-modal.js";
import { parseDescription } from "../../helpers/dom.js";
import {
  followAccount,
  getFollowSet,
  getMetadataEvent,
  getPubkeyFrom,
  getNostrizeUserPubkey,
  unfollowAccount,
} from "../../helpers/nostr.js";
import { getNostrizeUserRelays } from "../../helpers/relays.js";
import { getLnurlData } from "../../helpers/lnurl.js";
import { lightsatsModalComponent } from "../../components/lightsats/lightsats-modal.js";
import { wrapInputTooltip } from "../../components/tooltip/tooltip-wrapper.js";

import {
  createTwitterButton,
  setupNostrMode,
  updateFollowButton,
} from "./twitter-helpers.js";
import { setupNostrProfileLink } from "./twitter-helpers.js";
import { getNip65Relays } from "../../helpers/nip65.ts";
import { getNostrizeSettings } from "../../helpers/accounts.ts";

async function twitterProfilePage() {
  const settings = await Either.getOrElseThrow({
    eitherFn: getNostrizeSettings,
  });

  const log = logger({ ...settings.debug, namespace: "[N][X-Profile]" });

  const pageUsername = window.location.href.match(
    /^https:\/\/x\.com\/(.*?)(?=\?|\s|$)/,
  )[1];

  const removeNostrButtons = () => {
    gui.gebid("n-tw-zap-button")?.remove();
    gui.gebid("n-tw-lightsats-button")?.remove();
    gui.gebid("n-follows-you-indicator")?.remove();
    gui.gebid("n-tw-nostr-profile-button")?.remove();
    gui.gebid("n-tw-follow-unfollow-button")?.remove();
    gui.gebid("n-tw-account-notes")?.remove();
    gui.gebid("n-tw-enable-nostr-mode-checkbox")?.remove();
    gui.gebid("n-tw-notes-section")?.remove();
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
    ].some((s) => pageUsername.startsWith(s))
  ) {
    log("not an account page: " + pageUsername);

    return;
  }

  log("pageUsername", pageUsername);

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

  await html.asyncScript({
    id: "nostrize-nip07-provider",
    src: browser.runtime.getURL("nostrize-nip07-provider.js"),
  });

  const nostrizeUserPubkey = await Either.getOrElseThrow({
    eitherFn: () =>
      getNostrizeUserPubkey({
        mode: settings.nostrSettings.mode,
        nostrConnectSettings: settings.nostrSettings.nostrConnect,
      }),
  });

  // will be used to create zap, follow/unfollow and lightsats buttons
  const buttonTobeCloned = document.querySelector(
    "button[data-testid='userActions']",
  );

  const isPageUserTwitterAccount = !buttonTobeCloned;

  if (!npub && !nip05 && !isPageUserTwitterAccount) {
    log("No Nostr integration found");

    if (
      settings.lightsatsSettings.enabled &&
      settings.lightsatsSettings.apiKey
    ) {
      const lightsatsButton = wrapInputTooltip({
        id: "n-tw-lightsats-button",
        input: createTwitterButton(buttonTobeCloned, pageUsername, {
          id: "n-tw-lightsats-button",
          emojiIcon: "💸",
          modalComponentFn: () =>
            lightsatsModalComponent({ user: pageUsername, settings }),
        }),
        tooltipText: `Orange pill ${pageUsername} with Lightning Network`,
      });

      gui.insertAfter(lightsatsButton, buttonTobeCloned);
    }

    return;
  }

  const pageUserPubkey = await getPubkeyFrom({
    nip05,
    npub,
    pageUsername,
    cachePrefix: "tw",
  });

  const nostrizeUserRelays = await getNostrizeUserRelays({
    settings,
    timeout: 4000,
  });

  const pageUserRelays = await getNip65Relays({
    pubkey: pageUserPubkey,
    relays: nostrizeUserRelays.readRelays,
  });

  const timelineNavbar = document.querySelector(
    'nav[aria-label="Profile timelines"]',
  );

  setupNostrMode({
    timelineNavbar,
    pageUserPubkey,
    pageUserWriteRelays: pageUserRelays.writeRelays,
    settings,
  });

  const metadataEvent = await getMetadataEvent({
    cacheKey: pageUserPubkey,
    filter: { authors: [pageUserPubkey], kinds: [0], limit: 1 },
    relays: nostrizeUserRelays.readRelays,
  });

  const pageUserIsNostrizeUser = pageUserPubkey === nostrizeUserPubkey;

  const handleContainer = setupNostrProfileLink(
    settings,
    pageUserPubkey,
    pageUserIsNostrizeUser,
    pageUserRelays.writeRelays,
  );

  if (!pageUserIsNostrizeUser) {
    getFollowSet({
      pubkey: pageUserPubkey,
      relays: pageUserRelays.writeRelays,
      callback: ({ followSet }) => {
        const pageUserFollowsNostrizeUser = followSet.has(nostrizeUserPubkey);

        log("pageUserFollowsNostrizeUser", pageUserFollowsNostrizeUser);

        if (pageUserFollowsNostrizeUser) {
          handleContainer?.append(
            wrapInputTooltip({
              id: "n-follows-you-indicator",
              input: html.span({
                text: "Follows you",
                classList: "n-follows-you-indicator",
              }),
              tooltipText: `${pageUsername} follows you on Nostr.`,
            }),
          );
        }
      },
    });

    // follows of the nostrize user
    // the button to follow/unfollow

    if (!isPageUserTwitterAccount) {
      getFollowSet({
        pubkey: nostrizeUserPubkey,
        relays: nostrizeUserRelays.writeRelays,
        timeout: 1000 * 60 * 10, // 10 minutes
        callback: ({ followSet, latestEvent }) => {
          gui.gebid("n-tw-follow-unfollow-button")?.remove();

          let userFollowsNostrizeUser = followSet.has(pageUserPubkey);

          const button = wrapInputTooltip({
            id: "n-tw-follow-unfollow-button",
            input: createTwitterButton(buttonTobeCloned, pageUsername, {
              emojiIcon: userFollowsNostrizeUser ? "➖" : "➕",
              modalComponentFn: async () => {
                const followParams = {
                  pubkey: nostrizeUserPubkey,
                  currentFollowEvent: latestEvent,
                  pageUserPubkey,
                  relays: nostrizeUserRelays.writeRelays,
                  log,
                };

                button.disabled = true;

                updateFollowButton(
                  gui.gebid("n-tw-follow-unfollow-button"),
                  "⏳",
                );

                try {
                  if (userFollowsNostrizeUser) {
                    await unfollowAccount(followParams);
                  } else {
                    await followAccount(followParams);
                  }
                } catch (err) {
                  alert("Nostrize error on follow/unfollow: " + err);
                }
              },
            }),
            tooltipText: `${userFollowsNostrizeUser ? "Unfollow" : "Follow"} ${pageUsername} on Nostr`,
          });

          gui.insertAfter(button, buttonTobeCloned);
        },
      });
    }
  }

  const lnurlData = await getOrInsertPageCache({
    key: `nostrize-lnurldata-${metadataEvent.id}`,
    insertCallback: () =>
      Either.getOrElseThrow({
        eitherFn: () => getLnurlData({ metadataEvent, log }),
      }),
  });

  if (!isPageUserTwitterAccount) {
    const zapButton = wrapInputTooltip({
      id: "n-tw-zap-button",
      input: createTwitterButton(buttonTobeCloned, pageUsername, {
        id: "n-tw-zap-button",
        emojiIcon: "⚡️",
        modalComponentFn: () =>
          zapModalComponent({
            user: pageUsername,
            metadataEvent,
            nostrizeUserRelays,
            lnurlData,
            log,
            settings,
          }),
      }),
      tooltipText: `Zap ${pageUsername}`,
    });

    gui.insertAfter(zapButton, buttonTobeCloned);
  }
}

twitterProfilePage().catch((e) => console.error(e));
