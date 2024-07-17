import { logger } from "../../../helpers/logger.js";
import { createEmojiContainer } from "../helpers/dom.js";
import { button, div, hr, link, span } from "../../../imgui-dom/src/html.js";
// import { fetchUserLud16 } from "../../../helpers/relays";
import IssueTemplate from "./issue-template.js";

async function githubIssuePage() {
  const { settings } = await chrome.storage.sync.get(["settings"]);

  const log = logger(settings.debug);

  const pathParts = window.location.pathname
    .split("/")
    .filter((part) => part.length > 0);

  // Assuming the URL pattern is https://github.com/{user}/{repo}/issues/{issueid}
  if (pathParts.length !== 4 || pathParts[2] !== "issues") {
    return;
  }

  const user = pathParts[0];
  const repo = pathParts[1];
  const issueId = pathParts[3];

  // This will be there when user has clicked on the "Give a grant" button in issues page
  const isGrant =
    new URLSearchParams(window.location.search).get("n-grant-an-issue") === "1";

  log(
    `User: ${user}, Repo: ${repo}, Issue Id: ${issueId}, Is Grant: ${isGrant}`,
  );

  const putRewardTemplate = ({ auto }) => {
    const commentBox = document.querySelector('textarea[name="comment[body]"]');

    // Don't append the template if it is isGrant & comment box is not empty
    if (!(auto && commentBox.value)) {
      document.querySelector(
        "#partial-new-comment-form-actions button.btn.btn-primary",
      ).style.display = "none";
      commentBox.value += IssueTemplate;
      commentBox.style.height = `${commentBox.scrollHeight}px`;
    }

    const actionsContainer = document.getElementById(
      "partial-new-comment-form-actions",
    );

    if (!document.getElementById("n-publish-to-nostr")) {
      actionsContainer
        .querySelector("div:nth-of-type(3)")
        .append(createPublishToNostrButton());
    }
  };

  const createEmojies = () =>
    createEmojiContainer([
      div({
        classList: "n-tooltip-container n-reward-emoji",
        children: [
          link({
            classList: "no-underline Button",
            href: "javascript:void(0)",
            onclick: () => putRewardTemplate({ auto: false }),
            text: "🏅",
          }),
          span({
            classList: "n-tooltiptext",
            text: "Put a reward template",
          }),
        ],
        style: ["display", "inline-block"],
      }),
    ]);

  const createPublishToNostrButton = () =>
    div({
      classList: "n-tooltip-container",
      children: [
        button({
          type: "submit",
          id: "n-publish-to-nostr",
          classList: "btn-primary btn",
          onclick: async (event) => {
            var result = await window.nostrize();

            if (!result) {
              event.preventDefault();
            }
          },
          text: "Nostrize & Comment",
        }),
        span({
          classList: "n-tooltiptext",
          text: "Publish to Nostrize & Comment to GitHub",
        }),
      ],
    });

  const isEmojiContainerExist = document.getElementById("n-toolbar-container");

  if (!isEmojiContainerExist) {
    const toolbarItemContainer = document.querySelector(
      "#new_comment_form action-bar > div",
    );

    const toolbarContainer = div({
      id: "n-toolbar-container",
      classList: "ActionBar-item",
      children: [createEmojies()],
    });

    toolbarItemContainer.append(
      hr({ classList: "ActionBar-item ActionBar-divider" }),
    );
    toolbarItemContainer.append(toolbarContainer);

    if (isGrant) {
      putRewardTemplate({ auto: true });
    }
  }
}

githubIssuePage();
