import { getNostrizeSettings } from "../../helpers/accounts.ts";
import { Either } from "../../helpers/either.ts";
import { logger } from "../../helpers/logger.js";
import { button, div, hr, link, span } from "../../imgui-dom/html.js";
import IssueTemplate from "./issue-template.js";

function querySelectorOr(selector1, selector2) {
  let element = document.querySelector(selector1);

  if (!element) {
    element = document.querySelector(selector2);
  }

  if (!element) {
    throw new Error("querySelectorOr has failed");
  }

  return element;
}

async function githubIssuePage() {
  const settings = Either.getOrElseThrow({ eitherFn: getNostrizeSettings });

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
    const commentBox = querySelectorOr(
      'textarea[name="comment[body]"]',
      'textarea[name="issue[body]"]',
    );

    const sendButton = querySelectorOr(
      "#partial-new-comment-form-actions button.btn.btn-primary",
      "#new_issue button.btn-primary.btn.ml-2",
    );

    // Don't append the template if it is isGrant & comment box is not empty
    if (!(auto && commentBox.value)) {
      sendButton.style.display = "none";
      commentBox.value += IssueTemplate;
      commentBox.style.height = `${commentBox.scrollHeight}px`;
    }

    if (!document.getElementById("n-publish-to-nostr")) {
      sendButton.parentNode.append(createPublishToNostrButton());
    }
  };

  const createEmojiButton = () =>
    div({
      children: [
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
          style: [
            ["display", "inline-block"],
            ["right", "4px"],
          ],
        }),
      ],
      style: [
        ["height", "32px"],
        ["width", "32px"],
        ["background-color", "#8250df"],
        ["border-radius", "6px"],
      ],
    });

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
    const toolbarItemContainer = querySelectorOr(
      "#new_comment_form action-bar > div",
      "#new_issue action-bar > div",
    );

    const toolbarContainer = div({
      id: "n-toolbar-container",
      classList: "ActionBar-item",
      children: [createEmojiButton()],
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
