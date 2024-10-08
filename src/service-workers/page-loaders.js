import { logger } from "../helpers/logger.js";

export const pageLoaderListener = (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") {
    return;
  }

  if (changeInfo.favIconUrl) {
    return;
  }

  const url = tab.url;
  const page = getPageFromUrl(tab.url);

  if (!page) {
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
  } else if (page.startsWith("twitter/")) {
    injectTwitterScripts({ page, tabId });
  } else if (page.startsWith("telegram/web")) {
    injectTelegramWebScripts({ page, tabId });
  } else if (page.startsWith("nostrize")) {
    injectNostrizeScripts({ page, tabId });
  }
};

function getPageFromUrl(url) {
  try {
    const parsedUrl = new URL(url);

    const checkHosts = (...hosts) => {
      return hosts.some(
        (host) =>
          parsedUrl.hostname === host || parsedUrl.hostname === `www.${host}`,
      );
    };

    // Check for Twitter/X URLs
    if (checkHosts("twitter.com", "x.com")) {
      if (parsedUrl.pathname.match(/^\/[^/]+$/)) {
        return "twitter/profile";
      }

      // Check for YouTube URLs
    } else if (checkHosts("youtube.com", "m.youtube.com")) {
      if (parsedUrl.pathname.match(/^\/@.+/)) {
        return "youtube/channel";
      } else if (parsedUrl.pathname.match(/^\/channel\/.+/)) {
        return "youtube/channel";
      } else if (parsedUrl.pathname.match(/^\/shorts\/.+/)) {
        return "youtube/shorts";
      } else if (
        parsedUrl.pathname === "/watch" &&
        parsedUrl.searchParams.has("v")
      ) {
        return "youtube/watch";
      }

      // Check for GitHub URLs
    } else if (checkHosts("github.com")) {
      if (parsedUrl.pathname.match(/^\/[^/]+\/[^/]+\/issues$/)) {
        return "github/issues";
      } else if (parsedUrl.pathname.match(/^\/[^/]+\/[^/]+\/issues\/.+/)) {
        return "github/issue";
      } else if (parsedUrl.pathname.match(/^\/[^/]+\/?$/)) {
        return "github/profile";
      } else if (parsedUrl.pathname.match(/^\/?$/)) {
        return "github/feed";
      }

      // Check for Telegram Web URLs
    } else if (checkHosts("web.telegram.org")) {
      return "telegram/web";
    } else if (checkHosts("nostrize.me")) {
      if (parsedUrl.pathname.match(/^\/pages\/nip07-relays-manager\.html$/)) {
        return "nostrize/nip07-relays-manager";
      } else if (
        parsedUrl.pathname.match(/^\/pages\/nip07-metadata-manager\.html$/)
      ) {
        return "nostrize/nip07-metadata-manager";
      }
    }

    // Return undefined if none of the above conditions match
    return;
  } catch (e) {
    log("Invalid URL:", e);

    return;
  }
}

function injectNostrizeScripts({ page, tabId }) {
  if (page === "nostrize/nip07-relays-manager") {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["nostrize-nip07-relays-manager.js"],
    });
  } else if (page === "nostrize/nip07-metadata-manager") {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["nostrize-nip07-metadata-manager.js"],
    });
  }
}

function injectTelegramWebScripts({ page, tabId }) {
  if (page === "telegram/web") {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["telegram-web-bio.js"],
    });

    // Inject CSS file
    chrome.scripting.insertCSS({
      target: { tabId },
      files: ["telegram-web-bio.css", "zap-modal.css"],
    });
  }
}

function injectTwitterScripts({ page, tabId }) {
  if (page === "twitter/profile") {
    // Inject JavaScript file
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["twitter-profile.js"],
    });

    // Inject CSS file
    chrome.scripting.insertCSS({
      target: { tabId },
      files: [
        "twitter-profile.css",
        "zap-modal.css",
        "lightsats-modal.css",
        "nostrize-tooltip.css",
        "nostrize-checkbox.css",
        "twitter-notes.css",
      ],
    });
  }
}

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
  } else if (page === "github/feed") {
    // Inject JavaScript file
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["github-boost.js"],
    });

    // Inject CSS file
    chrome.scripting.insertCSS({
      target: { tabId },
      files: ["github-boost.css"],
    });
  }
}

const log = logger({ log: false, namespace: "[Nostrize][page-loader]" });
