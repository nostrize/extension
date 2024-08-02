import { logger } from "../helpers/logger.js";
import { getLocalSettings } from "../helpers/local-cache.js";

import { keyGeneratorListeners } from "./key-generator.js";
import { pageLoaderListener } from "./page-loaders.js";
import { fetchBunkerPointerListeners } from "./bunker-helpers.js";
import { zapperListeners } from "./zap-helpers.js";

async function addListeners() {
  const settings = await getLocalSettings();

  // dynamicly load content scripts and css
  chrome.tabs.onUpdated.addListener(pageLoaderListener);

  // key derivation listeners
  chrome.runtime.onMessage.addListener(keyGeneratorListeners);

  // bunker related listeners
  const bunkerLogger = logger({ ...settings.debug, namespace: "[N][Bunker]" });

  chrome.runtime.onMessage.addListener(
    fetchBunkerPointerListeners(bunkerLogger),
  );

  // zap related helpers
  const zapperLogger = logger({ ...settings.debug, namespace: "[N][Zapper]" });

  chrome.runtime.onMessage.addListener(zapperListeners(zapperLogger));
}

addListeners().catch((error) => console.log(error));
