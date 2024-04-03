import { logger } from "../../../helpers/logger";

async function githubIssuePage() {
  const { settings } = await chrome.storage.sync.get(["settings"]);

  if (!settings.github.issues) {
    return;
  }

  const log = logger(settings.debug);
  // const tap = tapper(settings.debug);

  const pathParts = window.location.pathname
    .split("/")
    .filter((part) => part.length > 0);

  // Assuming the URL pattern is https://github.com/{user}/{repo}/issues/{issueid}
  if (pathParts.length !== 4 || pathParts[2] !== "issues") {
    throw new Error("Unexpected content script issue, or github URL mismatch");
  }

  const user = pathParts[0];
  const repo = pathParts[1];
  const issueId = pathParts[3];

  log(`User: ${user}, Repo: ${repo}, Issue Id: ${issueId}`);
}

githubIssuePage();
