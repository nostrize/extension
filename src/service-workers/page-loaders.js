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
  } else if (url.match(/^https:\/\/www\.youtube\.com\/@.+/)) {
    return "youtube/channel";
  } else if (url.match(/^https:\/\/www\.youtube\.com\/channel\/.+/)) {
    return "youtube/channel";
  } else if (url.match(/^https:\/\/www\.youtube\.com\/shorts\/.+/)) {
    return "youtube/shorts";
  } else if (url.match(/^https:\/\/www\.youtube\.com\/watch\?.+/)) {
    return "youtube/watch";
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

    // Inject CSS file
    chrome.scripting.insertCSS({
      target: { tabId },
      files: ["youtube-channel.css"],
    });
  } else if (page === "youtube/shorts") {
    // Inject JavaScript file
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["youtube-shorts.js"],
    });

    // Inject CSS file
    chrome.scripting.insertCSS({
      target: { tabId },
      files: ["youtube-shorts.css", "zap-modal.css"],
    });
  } else if (page === "youtube/watch") {
    // Inject JavaScript file
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["youtube-watch.js"],
    });

    // Inject CSS file
    chrome.scripting.insertCSS({
      target: { tabId },
      files: ["youtube-watch.css", "zap-modal.css"],
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
      files: ["github-profile.css", "zap-modal.css"],
    });
  }
}

const log = logger({ log: false, namespace: "[Nostrize][page-loader]" });
