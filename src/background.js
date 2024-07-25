import { logger } from "./helpers/logger.js";

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
    chrome.scripting.insertCSS({
      target: { tabId },
      files: ["profile.css", "modal.css"],
    });
  }
});
