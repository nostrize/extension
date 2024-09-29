import { div, link, span } from "../../imgui-dom/html.js";
import { logger } from "../../helpers/logger.js";
import { getNostrizeSettings } from "../../helpers/accounts.ts";
import { Either } from "../../helpers/either.ts";

async function githubIssuesPage() {
  const settings = Either.getOrElseThrow({ eitherFn: getNostrizeSettings });

  const log = logger(settings.debug);
  const pathParts = window.location.pathname
    .split("/")
    .filter((part) => part.length > 0);

  // Assuming the URL pattern is https://github.com/{user}/{repo}/issues
  if (pathParts.length !== 3 || pathParts[2] !== "issues") {
    return;
  }

  const user = pathParts[0];
  const repo = pathParts[1];
  log(`User: ${user}, Repo: ${repo}`);

  const createIssueHref = (issueId) =>
    `https://github.com/${user}/${repo}/issues/${issueId}?n-grant-an-issue=1`;

  const createEmojiButton = (issueId) =>
    div({
      classList: "n-emoji-container",
      children: [
        div({
          classList: "n-emoji",
          children: [
            div({
              classList: "n-tooltip-container n-reward-emoji",
              children: [
                link({
                  classList: "no-underline",
                  href: createIssueHref(issueId),
                  text: "🏅",
                }),
                span({
                  classList: "n-tooltiptext",
                  text: "Give a reward for this issue",
                }),
              ],
              style: ["display", "inline-block"],
            }),
          ],
        }),
      ],
    });

  // iterate over issue links (eg: id=issue_2_link)
  document
    .querySelectorAll('a[id^="issue_"][id$="_link"]')
    .forEach(function (a) {
      const issueId = a.id.split("issue_")[1].split("_")[0];

      const parentContainer = a.parentElement;

      if (!parentContainer.classList.contains("n-issue-container")) {
        parentContainer.classList.add("n-issue-container");

        const emojiContainer = createEmojiButton(issueId);
        parentContainer.prepend(emojiContainer);
        parentContainer.prepend(a);
      }
    });
}

githubIssuesPage();
