import browser from "webextension-polyfill";

import * as html from "../imgui-dom/html.js";

import { getPubkeyFromNip07 } from "../helpers/nip07.js";
import {
  getCurrentNostrizeAccount,
  getNostrizeSettings,
  saveCurrentNostrizeAccount,
} from "../helpers/accounts.ts";
import { Either } from "../helpers/either.ts";
import { getMetadataEvent } from "../helpers/nostr.js";
import { getNostrizeUserRelays } from "../helpers/relays.js";

async function nip07MetadataManagerPage() {
  const settings = await Either.getOrElseThrow({
    eitherFn: getNostrizeSettings,
  });

  await html.asyncScript({
    id: "nostrize-nip07-provider",
    src: browser.runtime.getURL("nostrize-nip07-provider.js"),
  });

  const pubkey = await getPubkeyFromNip07();

  const nostrizeUserRelays = await getNostrizeUserRelays({
    settings,
    pubkey,
  });

  const metadataEvent = await getMetadataEvent({
    cacheKey: pubkey,
    filter: { authors: [pubkey], kinds: [0], limit: 1 },
    relays: nostrizeUserRelays.writeRelays,
  });

  const metadata = JSON.parse(metadataEvent.content);

  const accountEither = await getCurrentNostrizeAccount();

  if (Either.isLeft(accountEither)) {
    throw new Error("No current nostrize account");
  }

  const account = Either.getRight(accountEither);

  await saveCurrentNostrizeAccount({
    ...account,
    kind: "fetched",
    pubkey,
    metadata,
  });
}

nip07MetadataManagerPage().catch((e) => console.log(e));
