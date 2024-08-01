import { logger } from "../helpers/logger.js";
import { keyGeneratorListeners } from "./key-generator.js";
import { pageLoaderListener } from "./page-loaders.js";
import { fetchBunkerPointerListeners } from "./bunker-helpers.js";

// dynamicly load content scripts and css
chrome.tabs.onUpdated.addListener(pageLoaderListener);

// key derivation listeners
chrome.runtime.onMessage.addListener(keyGeneratorListeners);

// bunker related listeners
const bunkerLogger = logger({
  log: false,
  namespace: "[nostrize][background]",
});

chrome.runtime.onMessage.addListener(fetchBunkerPointerListeners(bunkerLogger));
