import { logger } from "../../../helpers/logger";

async function githubProfilePage() {
  const { settings } = await chrome.storage.sync.get(["settings"]);

  settings.debug.namespace = "[N][Profile]";

  const pathParts = window.location.pathname
    .split("/")
    .filter((part) => part.length > 0);

  // Assuming the URL pattern is https://github.com/{user}
  if (pathParts.length !== 1) {
    throw new Error("Unexpected content script issue, or github URL mismatch");
  }

  const log = logger(settings.debug);

  const user = pathParts[0];

  log("user", user);
  log("Profile page");

  // TODO: Get NIP-05
}

githubProfilePage();
