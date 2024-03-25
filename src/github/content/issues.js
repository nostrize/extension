import { buildApp, div, span } from "../../imgui-dom/src/html";
import { logger } from "./helpers/logger";

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

  // Assuming the URL pattern is https://github.com/{user}/{repo}/issues
  if (pathParts.length < 3 || pathParts[2] !== "issues") {
    throw new Error("Unexpected content script issues, or github URL mismatch");
  }

  const user = pathParts[0];
  const repo = pathParts[1];
  log(`User: ${user}, Repo: ${repo}`);

  buildApp({
    appId: "issue_2",
    children: [],
  });

  // iterate over issue links (eg: id=issue_2_link)
  document
    .querySelectorAll('a[id^="issue_"][id$="_link"]')
    .forEach(function (a) {
      const issueId = a.id.split("issue_")[1].split("_")[0];
      log(`issue ${issueId}`);

      const container = div({ classList: "n_issue_container" });
      a.parentNode.insertBefore(container, a);

      container.appendChild(a);
      container.appendChild(div({ children: [span({ text: "🏅" })] }));
    });
}

githubIssuePage();
