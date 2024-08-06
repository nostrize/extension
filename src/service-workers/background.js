import browser from "webextension-polyfill";

import { pageLoaderListener } from "./page-loaders.js";

async function addListeners() {
  browser.tabs.onUpdated.addListener(pageLoaderListener);
}

addListeners().catch((error) => console.log(error));
