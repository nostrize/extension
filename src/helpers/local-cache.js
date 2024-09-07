import { mergeSettings } from "./utils.js";

export const defaultSettings = {
  version: 2,
  debug: {
    log: true,
    namespace: "[N]",
  },
  nostrSettings: {
    mode: "anon", // "anon" | "nip07",
    relays: ["wss://relay.damus.io"],
    nip07: {
      useRelays: false,
    },
    openNostr: "https://nost.at",
  },
  lightsatsSettings: {
    apiKey: "",
    enabled: false,
  },
};

export async function saveLocalSettings({ settings }) {
  await chrome.storage.local.set({ settings });
}

export async function getLocalSettings() {
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

export function getFromCache(key) {
  // Check if the key exists in local storage
  const cachedValue = localStorage.getItem(key);

  if (cachedValue) {
    // If it exists, return the cached value
    return JSON.parse(cachedValue);
  }

  return;
}

export function insertToCache(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function getOrInsertCache({
  key,
  insertCallback,
  removeInMs = 0,
  removeInMin = 0,
  removeInDays = 0,
  insertEmpty = false,
  skipEmpty = false,
}) {
  // Check if the key exists in local storage
  const cachedValue = localStorage.getItem(key);

  if (cachedValue) {
    // If it exists, return the cached value
    return JSON.parse(cachedValue);
  } else {
    // If it does not exist, call the fetch callback to get the value
    let value = await insertCallback();

    if (!value) {
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

    if (removeInMs || removeInMin || removeInDays) {
      setTimeout(
        () => localStorage.removeItem(key),
        removeInMs ||
          removeInMin * 60 * 1000 ||
          removeInDays * 24 * 60 * 60 * 1000,
      );
    }

    // Return the fetched value
    return value;
  }
}
