import browser from "webextension-polyfill";

import { pageLoaderListener } from "./page-loaders.js";
import { createTip, getTip } from "./lightsats.js";

async function addListeners() {
  browser.tabs.onUpdated.addListener(pageLoaderListener);
  browser.runtime.onMessage.addListener(createTip);
  browser.runtime.onMessage.addListener(getTip);
}

addListeners().catch((error) => console.log(error));
