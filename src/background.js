import * as R from "ramda";

const defaultSettings = {
  github: {
    issues: true,
  },
  debug: {
    log: true,
    border: true,
    namespace: "[nosterize]",
  },
};

const customMerge = R.mergeWithKey((key, left, defaults) => {
  if (R.is(Object, left) && R.is(Object, defaults)) {
    // If both are objects, merge them deeply with preference for the left
    return R.mergeDeepLeft(left, defaults);
  } else if (left === undefined && defaults !== undefined) {
    return defaults;
  } else if (left !== undefined && defaults === undefined) {
    return left;
  }

  return defaults;
});

async function initializeSettings() {
  const result = await chrome.storage.sync.get(["settings"]);

  const settings = result.settings
    ? customMerge(result.settings, defaultSettings)
    : defaultSettings;

  await chrome.storage.sync.set({ settings });
}

// Run the initialization function when the extension is installed/updated
chrome.runtime.onInstalled.addListener(initializeSettings);
