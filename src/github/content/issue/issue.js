import { html, render } from "htm/preact";

import { logger } from "../../../helpers/logger";
import { div } from "../../../imgui-dom/src/html";
import IssueTemplate from "./issue-template";

async function githubIssuePage() {
  const { settings } = await chrome.storage.sync.get(["settings"]);

  if (!settings.github.issues) {
    return;
  }

  const log = logger(settings.debug);

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

  const isGrant =
    new URLSearchParams(window.location.search).get("n-grant-an-issue") === "1";

  log(
    `User: ${user}, Repo: ${repo}, Issue Id: ${issueId}, Is Grant: ${isGrant}`,
  );

  const createEmojiContainer = () =>
    html`<div class="n-emoji-container">
      <ul>
        <li>
          <span class="emoji">
            <a
              class="no-underline"
              href="javascript:void(0)"
              onClick=${() => putRewardTemplate({ auto: false })}
              >🏅</a
            >
          </span>
          <span class="tooltiptext">Put a reward template</span>
        </li>
      </ul>
    </div> `;

  const toolbarItemContainer = document.body.querySelectorAll(
    'div[data-target="action-bar.itemContainer"]',
  )[1];

  const toolbarContainer = div({
    id: "n-toolbar-container",
    classList: "ActionBar-item",
  });

  toolbarItemContainer.insertBefore(
    toolbarContainer,
    toolbarItemContainer.firstChild,
  );

  render(createEmojiContainer(), toolbarContainer);

  const putRewardTemplate = ({ auto }) => {
    const commentBox = document.querySelector('textarea[name="comment[body]"]');

    // Don't append the template if it is isGrant & comment box is not empty
    if (!(auto && commentBox.value)) {
      commentBox.value += IssueTemplate;
    }

    const commentButton = document.querySelector(
      'div#partial-new-comment-form-actions button[type="submit"].btn-primary',
    );

    // TODO: It's not enough to make it enabled, validation system doesn't recognize comment box has been filled
    commentButton.disabled = false;
  };

  if (isGrant) {
    putRewardTemplate({ auto: true });
  }
}

githubIssuePage();
