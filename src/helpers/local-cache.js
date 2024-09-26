import { mergeSettings } from "./utils.js";

/**
 * @typedef {Object} DebugSettings
 * @property {boolean} log
 * @property {string} namespace
 */

/**
 * @typedef {Object} RelayConfig
 * @property {string} relay
 * @property {boolean} enabled
 * @property {boolean} read
 * @property {boolean} write
 */

/**
 * @typedef {Object} RelaySettings
 * @property {boolean} useRelays
 * @property {RelayConfig[]} [relays]
 */

/**
 * @typedef {Object} NostrConnectSettings
 * @property {string} url
 * @property {string} customRelay
 * @property {string} username
 * @property {string} provider
 * @property {string} providerRelay
 * @property {Object} metadata
 * @property {string} userPubkey
 * @property {string} userNip05
 * @property {string} ephemeralKey
 * @property {string} ephemeralPubkey
 */

/**
 * @typedef {Object} NostrSettings
 * @property {('anon'|'nip07'|'nostrconnect')} mode
 * @property {{local: RelaySettings, nip07: RelaySettings, nip65: RelaySettings}} relays
 * @property {NostrConnectSettings} nostrConnect
 * @property {string} openNostr
 */

/**
 * @typedef {Object} LightsatsSettings
 * @property {string} apiKey
 * @property {boolean} enabled
 */

/**
 * @typedef {Object} Settings
 * @property {number} version
 * @property {DebugSettings} debug
 * @property {NostrSettings} nostrSettings
 * @property {LightsatsSettings} lightsatsSettings
 */

/** @type {Settings} */
export const defaultSettings = {
  version: 4,
  debug: {
    log: true,
    namespace: "[N]",
  },
  nostrSettings: {
    mode: "anon", // "anon" | "nip07" | "nostrconnect",
    relays: {
      local: {
        useRelays: true,
        relays: [
          {
            relay: "wss://relay.damus.io",
            enabled: true,
            read: true,
            write: true,
          },
          {
            relay: "wss://nostr.wine",
            enabled: true,
            read: true,
            write: false,
          },
          {
            relay: "wss://relay.snort.social",
            enabled: true,
            read: true,
            write: true,
          },
        ],
      },
      nip07: {
        useRelays: true,
      },
      nip65: {
        useRelays: true,
      },
    },
    nostrConnect: {
      url: "",
      customRelay: "",
      username: "",
      provider: "",
      providerRelay: "",
      metadata: {},
      userPubkey: "",
      userNip05: "",
      ephemeralKey: "",
      ephemeralPubkey: "",
    },
    openNostr: "https://nost.at",
  },
  lightsatsSettings: {
    apiKey: "",
    enabled: false,
  },
};

/**
 * @param {{settings: Settings}} param0
 */
export async function saveNostrizeSettings({ settings }) {
  await chrome.storage.local.set({ settings });
}

/**
 * @returns {Promise<Settings>}
 */
export async function getNostrizeSettings() {
  const { settings } = await chrome.storage.local.get(["settings"]);

  if (!settings) {
    await chrome.storage.local.set({ settings: defaultSettings });

    return defaultSettings;
  } else {
    console.log("version", settings.version);

    if (settings.version !== defaultSettings.version) {
      const mergedSettings = mergeSettings(settings, defaultSettings);
      mergedSettings.version = defaultSettings.version;

      await chrome.storage.local.set({ settings: mergedSettings });

      return mergedSettings;
    }
  }

  return settings;
}

export function getFromPageCache(key) {
  // Check if the key exists in local storage
  const cachedValue = localStorage.getItem(key);

  if (cachedValue) {
    // If it exists, return the cached value
    return JSON.parse(cachedValue);
  }

  return;
}

export function insertToPageCache(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function getOrInsertPageCache({
  key,
  insertCallback,
  insertEmpty = false,
  skipEmpty = false,
  updateCache = false,
}) {
  // Check if the key exists in local storage
  const cachedValue = localStorage.getItem(key);

  if (cachedValue != null) {
    // update the cache in the background
    if (updateCache) {
      insertCallback().then((value) => {
        updateCacheValue({
          key,
          value,
          insertEmpty,
          skipEmpty,
        });
      });
    }

    // If it exists, return the cached value
    return JSON.parse(cachedValue);
  } else {
    // If it does not exist, call the fetch callback to get the value
    let value = await insertCallback();

    updateCacheValue({
      key,
      value,
      insertEmpty,
      skipEmpty,
    });

    // Return the fetched value
    return value;
  }
}

async function updateCacheValue({ key, value, insertEmpty, skipEmpty }) {
  if (value == null) {
    if (insertEmpty) {
      value = null;
    } else if (skipEmpty) {
      return;
    } else {
      throw new Error("Failed to insert value into cache");
    }
  }

  // Store the value in local storage
  localStorage.setItem(key, JSON.stringify(value));
}
