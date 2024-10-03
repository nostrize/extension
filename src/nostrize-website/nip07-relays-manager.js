import browser from "webextension-polyfill";

import * as html from "../imgui-dom/html.js";

import { getNip07Relays } from "../helpers/nip07.js";
import {
  getNostrizeSettings,
  saveNostrizeSettings,
} from "../helpers/accounts.ts";
import { Either } from "../helpers/either.ts";

async function nip07RelaysManagerPage() {
  const settings = await Either.getOrElseThrow({
    eitherFn: getNostrizeSettings,
  });

  await html.asyncScript({
    id: "nostrize-nip07-provider",
    src: browser.runtime.getURL("nostrize-nip07-provider.js"),
  });

  const relays = await getNip07Relays();

  const localRelays = settings.nostrSettings.relays.local.relays;

  for (const [relayUrl, relay] of Object.entries(relays.relaysEntries)) {
    if (localRelays.find((r) => r.relay === relayUrl)) {
      continue;
    }

    localRelays.push({
      enabled: true,
      read: relay.read || (!relay.write && !relay.read),
      write: relay.write || (!relay.write && !relay.read),
      relay: relayUrl,
    });
  }

  console.log("localRelays", localRelays);

  await saveNostrizeSettings({
    settings: {
      ...settings,
      nostrSettings: {
        ...settings.nostrSettings,
        relays: {
          ...settings.nostrSettings.relays,
          local: {
            ...settings.nostrSettings.relays.local,
            relays: localRelays,
          },
        },
      },
    },
  });
}

nip07RelaysManagerPage().catch((e) => console.log(e));
