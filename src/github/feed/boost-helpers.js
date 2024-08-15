import * as html from "../../imgui-dom/html.js";

export const spaced = (element) => (params) =>
  element({ ...params, text: ` ${params.text} ` });

export const spanSpaced = spaced(html.span);

export const fetchGithubTitle = async (url) => {
  const res = await fetch(url);

  const html = await res.text();

  const parser = new DOMParser();
  const dom = parser.parseFromString(html, "text/html");

  return dom.querySelector("title").textContent;
};

export const githubUrlFor =
  (type) =>
  ({ to, issue, pull }) => {
    switch (type) {
      case "user":
      case "repo":
      case "org":
        return `https://github.com/${to}`;
      case "issue":
        return `https://github.com/${to}/issues/${issue}`;
      case "pr":
        return `https://github.com/${to}/pull/${pull}`;
    }
  };

export const githubUserUrl = (user) => `https://github.com/${user}`;

export const pickRandomEmoji = (str) => {
  const arr = str.split(" ");

  return arr[Math.floor(Math.random() * arr.length)];
};

const gratitudeEmojies = "🖖 🤟 🤘 👊 🙌 🤟 👏 🤌 👏";

export const typeToReactions = (type) =>
  ({
    user: gratitudeEmojies,
    org: gratitudeEmojies,
    pr: "📈 👀 🕵️ 👁 🛠️ 🔧 🔩 🔨",
    issue: "😩 🚨 🔔 🆘",
    repo: gratitudeEmojies,
  })[type];

export const prIcon = html.span({ classList: "n-github-pr-icon" });
prIcon.innerHTML = `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-git-pull-request UnderlineNav-octicon d-none d-sm-inline">
    <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"></path>
</svg>`;

export const issueIcon = html.span({ classList: "n-github-issue-icon" });
issueIcon.innerHTML = `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-issue-opened UnderlineNav-octicon d-none d-sm-inline">
    <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
</svg>`;

export function timeAgo(timestampInSeconds) {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const secondsAgo = nowInSeconds - timestampInSeconds;

  let value, unit;

  if (secondsAgo < 60) {
    value = secondsAgo;
    unit = "second";
  } else if (secondsAgo < 3600) {
    value = Math.floor(secondsAgo / 60);
    unit = "minute";
  } else if (secondsAgo < 86400) {
    value = Math.floor(secondsAgo / 3600);
    unit = "hour";
  } else {
    value = Math.floor(secondsAgo / 86400);
    unit = "day";
  }

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  return rtf.format(-value, unit);
}
