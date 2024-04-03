import { render } from "preact";
import { html } from "htm/preact";

import { div } from "../../imgui-dom/src/html";
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

  const createIssueHref = (issueId) =>
    `https://github.com/${user}/${repo}/issues/${issueId}?n-grant-an-issue=1`;

  const createEmojiContainer = (issueId) =>
    html`<div class="n-emoji-container">
      <ul>
        <li>
          <span class="emoji">
            <a class="no-underline" href="${createIssueHref(issueId)}">🏅</a>
          </span>
          <span class="tooltiptext">Give a reward for this issue</span>
        </li>
      </ul>
    </div> `;

  // iterate over issue links (eg: id=issue_2_link)
  document
    .querySelectorAll('a[id^="issue_"][id$="_link"]')
    .forEach(function (a) {
      const issueId = a.id.split("issue_")[1].split("_")[0];
      log(`issue ${issueId}`);

      const parentContainer = a.parentElement;
      const emojiContainer = createEmojiContainer(issueId);
      const issueContainer = div({ classList: "n-issue-container" });
      parentContainer.insertBefore(issueContainer, parentContainer.firstChild);

      render(emojiContainer, issueContainer);

      issueContainer.insertBefore(a, issueContainer.firstChild);
    });
}

githubIssuePage();
