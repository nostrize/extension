const defaultSettings = {
  debug: {
    log: true,
    border: true,
    namespace: "[N]",
  },
  nostrSettings: {
    mode: "nip07", // "anon" | "nip07",
    relays: ["wss://relay.damus.io"],
  },
};

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

export async function getOrInsertCache(key, insertCallback) {
  // Check if the key exists in local storage
  const cachedValue = localStorage.getItem(key);

  if (cachedValue) {
    // If it exists, return the cached value
    return JSON.parse(cachedValue);
  } else {
    // If it does not exist, call the fetch callback to get the value
    const value = await insertCallback();

    if (!value) {
      throw new Error("Failed to insert value into cache");
    }

    // Store the value in local storage
    localStorage.setItem(key, JSON.stringify(value));

    // Return the fetched value
    return value;
  }
}
