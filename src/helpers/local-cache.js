export const defaultSettings = {
  debug: {
    log: true,
    namespace: "[N]",
  },
  nostrSettings: {
    mode: "nip07", // "anon" | "nip07",
    relays: ["wss://relay.damus.io"],
    nip07: {
      useRelays: false,
    },
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
