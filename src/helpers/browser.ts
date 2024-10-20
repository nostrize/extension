import browser from "webextension-polyfill";

export async function getCurrentTabUrl(): Promise<string | undefined> {
  const tabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  return tabs && tabs[0] && tabs[0].url;
}

export const settingsUrl = browser.runtime.getURL("nostrize-settings.html");
