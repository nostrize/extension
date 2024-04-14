import * as R from "ramda";

import { logger } from "./helpers/logger";

const defaultSettings = {
  debug: {
    log: true,
    border: true,
    namespace: "[N]",
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

const getPageFromUrl = (url) => {
  if (url.match(/https:\/\/github\.com\/.*\/.*\/issues$/)) {
    return "issues";
  } else if (url.match(/https:\/\/github\.com\/.*\/.*\/issues\/.+/)) {
    return "issue";
  } else if (url.match(/https:\/\/github\.com\/([^/]+)\/?$/)) {
    return "profile";
  } else {
    return "";
  }
};

const log = logger({ log: false, namespace: "[nostrize][background]" });

// dynamicly load content scripts and css
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const url = tab.url;
  const page = getPageFromUrl(tab.url);

  if (!page) {
    return;
  }

  // Ensure the tab is loading, we delete it from our map
  if (changeInfo.status === "loading") {
    return;
  }

  if (changeInfo.status !== "complete" || changeInfo.favIconUrl) {
    return;
  }

  log("url", url);
  log("tabId", tabId);
  log("changeInfo", changeInfo);
  log("tab", tab);

  if (page === "issues") {
    // Inject JavaScript file
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["issues.js"],
    });

    // Inject CSS file
    chrome.scripting.insertCSS({
      target: { tabId },
      files: ["issues.css"],
    });
  } else if (page === "issue") {
    // Inject JavaScript file
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["issue.js"],
    });

    // Inject CSS file
    chrome.scripting.insertCSS({
      target: { tabId },
      files: ["issue.css"],
    });
  } else if (page === "profile") {
    // Inject JavaScript file
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["profile.js"],
    });

    // Inject CSS file
    // chrome.scripting.insertCSS({
    //   target: { tabId },
    //   files: ["profile.css"],
    // });
  }
});
