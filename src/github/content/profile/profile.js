import { finalizeEvent, Relay } from "nostr-tools";
import { makeZapRequest } from "nostr-tools/nip57";
import { toString as qrCode } from "qrcode/lib/browser.js";

import { logger } from "../../../helpers/logger.js";
import { getOrInsertCache } from "../../../helpers/local-cache.js";
import {
  fetchNpubFromNip05,
  getZapEndpoint,
  zapButtonOnClick,
} from "./helper.js";
import { fetchOneEvent } from "../../../helpers/relays.js";
import { link, div, span, input } from "../../../imgui-dom/src/html.js";
import { prepend, getOrCreateById } from "../../../imgui-dom/src/gui.js";
import { singletonFactory, Either } from "../../../helpers/utils.js";

const html = { link, div, span, input };
const gui = { prepend, getOrCreateById };

async function githubProfilePage() {
  const { settings } = await chrome.storage.sync.get(["settings"]);

  settings.debug.namespace = "[N][Profile]";

  const pathParts = window.location.pathname
    .split("/")
    .filter((part) => part.length > 0);

  // Assuming the URL pattern is https://github.com/{user}
  if (pathParts.length !== 1) {
    return;
  }

  const log = logger(settings.debug);

  const user = pathParts[0];
  const npub = await getOrInsertCache(`user_npub:${user}`, () =>
    fetchNpubFromNip05({ user, log }),
  );

  if (!npub) {
    log(`could not fetch user ${user}`);

    return;
  }

  // TODO: get it from settings
  const relayUrl = "wss://relay.damus.io";

  // TODO: use SimplePool, do we need multiple relays?
  const relayFactory = singletonFactory({
    factoryAsyncFn: async () => {
      const relay = new Relay(relayUrl);

      await relay.connect();

      return relay;
    },
  });

  const metadataEvent = await getOrInsertCache(`npub_kid0:${npub}`, () =>
    fetchOneEvent({
      relayFactory,
      filter: { authors: [npub], kinds: [0], limit: 1 },
    }),
  );

  log("metadataEvent", metadataEvent);

  const lnurlData = await getOrInsertCache(metadataEvent.id, () =>
    Either.getOrElseThrow(() => getZapEndpoint({ metadataEvent, log })),
  );

  const zapEndpoint = lnurlData.callback;
  const recipient = lnurlData.nostrPubkey;
  const vcardContainer = document.querySelector("div.vcard-names-container");

  const zapButton = html.link({
    classList: "no-underline Button",
    href: "javascript:void(0)",
    text: "⚡",
    style: [["right", "4px"]],
  });

  const amountSatsInput = html.input({ type: "number", value: 21 });

  const zapButtonClickEventHandler = () =>
    zapButtonOnClick({
      amountSats: amountSatsInput.value,
      html,
      fetchOneEvent,
      finalizeEvent,
      gui,
      lnurlData,
      log,
      makeZapRequest,
      metadataEvent,
      qrCode,
      recipient,
      relayFactory,
      relayUrl,
      user,
      vcardContainer,
      zapEndpoint,
      zapButton,
    });

  zapButton.onclick = zapButtonClickEventHandler;

  let zapButtonContainer = html.div({
    id: "n-zap-button",
    children: [
      amountSatsInput,
      html.span({ text: "sats" }),
      html.div({
        classList: "n-tooltip-container n-zap-emoji",
        children: [
          zapButton,
          html.span({
            classList: "n-tooltiptext",
            text: "Zap this user",
          }),
        ],
      }),
    ],
  });

  gui.prepend(vcardContainer, zapButtonContainer);
}

githubProfilePage().catch((error) => console.log(error));
