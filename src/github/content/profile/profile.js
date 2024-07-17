import { logger } from "../../../helpers/logger.js";

async function githubProfilePage() {
  const { settings } = await chrome.storage.sync.get(["settings"]);

  settings.debug.namespace = "[N][Profile]";

  const pathParts = window.location.pathname
    .split("/")
    .filter((part) => part.length > 0);

  // Assuming the URL pattern is https://github.com/{user}
  if (pathParts.length !== 1) {
    return;
  }

  const log = logger(settings.debug);

  const user = pathParts[0];

  log("user", user);
}

githubProfilePage();
