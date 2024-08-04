import { nip19, Relay } from "nostr-tools";

import { parseDescription } from "../youtube-helpers.js";

import * as gui from "../../imgui-dom/gui.js";
import * as html from "../../imgui-dom/html.js";
import {
  getLocalSettings,
  getOrInsertCache,
} from "../../helpers/local-cache.js";
import { logger } from "../../helpers/logger.js";
import { delay, Either, singletonFactory } from "../../helpers/utils.js";
import {
  fetchFromNip05,
  getZapEndpoint,
  zapModalComponent,
} from "../../components/zap-modal.js";
import { fetchOneEvent } from "../../helpers/relays.js";
import { createKeyPair } from "../../helpers/crypto.js";

async function getPubkeyFrom({ npub, nip05, user }) {
  if (npub) {
    const { type, data } = nip19.decode(npub);

    if (type !== "npub") {
      throw new Error("nip19 error");
    }

    return data;
  }

  const [username, domain] = nip05.split("@");
  const fetchUrl = `https://${domain}/.well-known/nostr.json?user=${username}`;

  const { pubkey } = await getOrInsertCache(`user_pubkey:${user}`, () =>
    Either.getOrElseThrow({
      eitherFn: () => fetchFromNip05({ user, fetchUrl }),
    }),
  );

  return pubkey;
}

async function youtubeShortsPage() {
  const { settings, nip05, npub, channel, log } = await Either.getOrElseThrow({
    eitherFn: loadParams,
  });

  const pubkey = await getPubkeyFrom({ nip05, npub });

  const relayFactory = singletonFactory({
    buildFn: async () => {
      const relay = new Relay(settings.nostrSettings.nostrRelayUrl);

      await relay.connect();

      return relay;
    },
  });

  const metadataEvent = await getOrInsertCache(`${pubkey}:kind0`, () =>
    fetchOneEvent({
      log,
      relayFactory,
      filter: { authors: [pubkey], kinds: [0], limit: 1 },
    }),
  );

  const lnurlData = await getOrInsertCache(metadataEvent.id, () =>
    Either.getOrElseThrow({
      eitherFn: () => getZapEndpoint({ metadataEvent, log }),
    }),
  );

  const localNostrKeys = createKeyPair();
  const zapEndpoint = lnurlData.callback;
  const recipient = lnurlData.nostrPubkey;

  const { zapModal, closeModal } = zapModalComponent({
    user: channel,
    metadataEvent,
    lnurlData,
    localNostrKeys,
    log,
    recipient,
    relayFactory,
    settings,
    zapEndpoint,
  });

  gui.prepend(
    document.querySelector("ytd-channel-name yt-formatted-string"),
    html.link({
      classList: "yt-simple-endpoint style-scope n-shorts-tip-button",
      text: "⚡Tip⚡",
      href: "javascript:void(0)",
      onclick: () => (zapModal.style.display = "block"),
    }),
  );

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
}

async function loadParams() {
  let channelNameLink = document.querySelector("ytd-channel-name a");

  while (!channelNameLink) {
    // need to wait a bit for document to load
    await delay(500);

    channelNameLink = document.querySelector("ytd-channel-name a");
  }

  // will give /@ChannelName
  const channelName = channelNameLink.attributes["href"].value;

  const res = await fetch(`https://www.youtube.com${channelName}`);
  const channelHtml = await res.text();

  const parser = new DOMParser();
  const channelDocument = parser.parseFromString(channelHtml, "text/html");

  const { nip05, npub } = parseDescription(
    channelDocument.querySelector('meta[property="og:description"]'),
  );

  const canLoad = nip05 || npub;

  if (canLoad) {
    const channel = channelName.substring(2);

    const settings = await getLocalSettings();

    const log = logger({ ...settings.debug, namespace: "[N][Shorts]" });

    return Either.right({ nip05, npub, channel, settings, log });
  }

  return Either.left("Channel doesn't have a Nostrize integration");
}

youtubeShortsPage().catch((e) => console.error(e));
