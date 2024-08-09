import * as html from "../../imgui-dom/html.js";

export const spaced = (element) => (params) =>
  element({ ...params, text: ` ${params.text} ` });

export const spanSpaced = spaced(html.span);
export const linkSpaced = spaced(html.link);

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

export const relativeTime = ({ datetime, classList = "n-relative-time" }) => {
  const element = html.customElement({
    tagName: "relative-time",
    attributes: [
      ["tense", "past"],
      ["data-view-component", "true"],
    ],
    classList,
  });

  element["datetime"] = datetime;
  element["title"] = new Date(datetime).toString();

  return element;
};

export const ago = (hours) => Date.now() - 1000 * 60 * 60 * hours;

const gratitudeEmojies = "🖖 🤟 🤘 👊 🙌 🤟 👏 🤌 👏";

export const pickRandomEmoji = (str) => {
  const arr = str.split(" ");

  return arr[Math.floor(Math.random() * arr.length)];
};

export const typeToReactions = (type) =>
  ({
    user: gratitudeEmojies,
    org: gratitudeEmojies,
    pr: "📈 👀 🕵️ 👁 🛠️ 🔧 🔩 🔨",
    issue: "😩 🚨 🔔 🆘",
    repo: gratitudeEmojies,
  })[type];

export const typeEmojies = {
  repo: "💾 🖥️ 💻",
  user: "🧑 🧑 🧑‍🏭 👷‍♂️",
  org: "👥 🤝",
  issue: "🚨 🔔",
  pr: "🔧 🔩 🔨",
};
