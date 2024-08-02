import { logger } from "../helpers/logger.js";

export const pageLoaderListener = (tabId, changeInfo, tab) => {
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

  if (page.startsWith("github/")) {
    injectGithubScripts({ page, tabId });
  } else if (page.startsWith("youtube/")) {
    injectYoutubeScripts({ page, tabId });
  }
};

const getPageFromUrl = (url) => {
  if (url.match(/https:\/\/github\.com\/.*\/.*\/issues$/)) {
    return "github/issues";
  } else if (url.match(/https:\/\/github\.com\/.*\/.*\/issues\/.+/)) {
    return "github/issue";
  } else if (url.match(/https:\/\/github\.com\/([^/]+)\/?$/)) {
    return "github/profile";
  } else if (url.match(/^https:\/\/www\.youtube\.com\/@[a-zA-Z0-9_-]+z/)) {
    return "youtube/channel";
  } else {
    return "";
  }
};

function injectYoutubeScripts({ page, tabId }) {
  if (page === "youtube/channel") {
    // Inject JavaScript file
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["youtube-channel.js"],
    });
  }
}

function injectGithubScripts({ page, tabId }) {
  if (page === "github/issues") {
    // Inject JavaScript file
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["github-issues.js"],
    });

    // Inject CSS file
    chrome.scripting.insertCSS({
      target: { tabId },
      files: ["github-issues.css"],
    });
  } else if (page === "github/issue") {
    // Inject JavaScript file
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["github-issue.js"],
    });

    // Inject CSS file
    chrome.scripting.insertCSS({
      target: { tabId },
      files: ["github-issue.css"],
    });
  } else if (page === "github/profile") {
    // Inject JavaScript file
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["github-profile.js"],
    });

    // Inject CSS file
    chrome.scripting.insertCSS({
      target: { tabId },
      files: ["github-profile.css", "github-profile-modal.css"],
    });
  }
}

const log = logger({ log: false, namespace: "[nostrize][page-loader]" });
