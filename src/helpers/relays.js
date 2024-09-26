import { getNip07Relays } from "./nip07.js";
import { getNip65Relays } from "./nip65.js";
import { uniqueArrays } from "./utils.js";

export async function getNostrizeUserRelays({ settings, pubkey }) {
  const useLocalRelays = settings.nostrSettings.relays.local.useRelays;

  const localRelays = toReadWriteRelays(
    settings.nostrSettings.relays.local.relays,
  );

  if (settings.nostrSettings.mode === "anon") {
    // don't even check useRelays in anon mode
    return localRelays;
  }

  const useNip65Relays = settings.nostrSettings.relays.nip65.useRelays;

  if (settings.nostrSettings.mode === "nip07") {
    const useNip07Relays = settings.nostrSettings.relays.nip07.useRelays;
    const nip07Relays = await getNip07Relays();

    const nip65Relays = await getNip65Relays({
      pubkey,
      relays: uniqueArrays(
        useLocalRelays ? localRelays.writeRelays : [],
        useNip07Relays ? nip07Relays.writeRelays : [],
      ),
    });

    return {
      readRelays: uniqueArrays(
        useLocalRelays ? localRelays.readRelays : [],
        useNip65Relays ? nip65Relays.readRelays : [],
      ),
      writeRelays: uniqueArrays(
        useLocalRelays ? localRelays.writeRelays : [],
        useNip65Relays ? nip65Relays.writeRelays : [],
      ),
    };
  } else if (
    settings.nostrSettings.mode === "nostrconnect" ||
    settings.nostrSettings.mode === "bunker"
  ) {
    const nip65Relays = await getNip65Relays({
      pubkey,
      relays: localRelays.writeRelays,
    });

    return {
      readRelays: uniqueArrays(
        useLocalRelays ? localRelays.readRelays : [],
        useNip65Relays ? nip65Relays.readRelays : [],
      ),
      writeRelays: uniqueArrays(
        useLocalRelays ? localRelays.writeRelays : [],
        useNip65Relays ? nip65Relays.writeRelays : [],
      ),
    };
  } else {
    throw new Error("not implemented");
  }
}

function toReadWriteRelays(localRelays) {
  const enabledLocalRelays = localRelays.filter((relay) => relay.enabled);

  const writeRelays = enabledLocalRelays
    .filter((relay) => relay.write)
    .map((relay) => relay.relay);

  const readRelays = enabledLocalRelays
    .filter((relay) => relay.read)
    .map((relay) => relay.relay);

  return { writeRelays, readRelays };
}
