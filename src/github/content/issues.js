import { div, span } from "../../imgui-dom/src/html";
import { reset } from "../../imgui-dom/src/gui";
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

  // iterate over issue links (eg: id=issue_2_link)
  document
    .querySelectorAll('a[id^="issue_"][id$="_link"]')
    .forEach(function (a) {
      const issueId = a.id.split("issue_")[1].split("_")[0];
      log(`issue ${issueId}`);

      let rewardIconState = {
        onMouseOver: false,
      };

      const issueApp = div({
        classList: "n-issue-container",
      });

      a.parentNode.insertBefore(issueApp, a);
      issueApp.appendChild(a);

      function loop() {
        const resetFn = () =>
          reset({ app: emojiContainer, state: rewardIconState, log });

        const rewardTooptipBuilder = () =>
          span({ text: "Give a reward for this issue" });

        const reward = span({
          text: "🏅",
          eventTuples: [
            [
              "mouseover",
              () => {
                rewardIconState.onMouseOver = true;

                resetFn();

                loop();
              },
            ],
            [
              "mouseout",
              () => {
                rewardIconState.onMouseOver = false;

                resetFn();

                loop();
              },
            ],
          ],
        });

        const children = rewardIconState.onMouseOver
          ? [rewardTooptipBuilder(), reward]
          : [reward];

        const emojiContainer = div({
          classList: ["n-emoji-container"],
          children,
        });

        issueApp.replaceChild(emojiContainer);

        if (settings.debug.border) {
          ["div", "a"].forEach((tag) => {
            issueApp
              .querySelectorAll(tag)
              .forEach((_) => (_.style.border = "1px solid #000"));
          });
        }
      }

      loop();
    });
}

githubIssuePage();
