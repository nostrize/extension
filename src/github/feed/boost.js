import * as gui from "../../imgui-dom/gui.js";
import * as html from "../../imgui-dom/html.js";
import {
  getNostrizeSettings,
  getOrInsertPageCache,
} from "../../helpers/local-cache.js";
import { getIconComponent } from "../github-connect.js";
import { logger } from "../../helpers/logger.js";
import { timeAgo } from "../../helpers/time.js";

import {
  fetchGithubTitle,
  githubUrlFor,
  issueIcon,
  pickRandomEmoji,
  prIcon,
  spanSpaced,
  typeToReactions,
} from "./boost-helpers.js";

const agoInSeconds = ({ hours }) =>
  Math.floor((Date.now() - 1000 * 60 * 60 * hours) / 1000);

async function githubBoostPanel() {
  const settings = await getNostrizeSettings();

  const log = logger({ ...settings.debug, namespace: "[N][GH-Booster]" });

  const boosts = [
    {
      type: "org",
      from: "dhalsim",
      to: "nostr-protocol",
      created_at: agoInSeconds({ hours: 1 }),
      amountSats: 5000,
      message: "Respect to the OGs",
    },
    {
      type: "issue",
      from: "dhalsim",
      to: "nostrize/extension",
      issue: 2,
      created_at: agoInSeconds({ hours: 2 }),
      amountSats: 21000,
      message: "Please someone help me 😭, this bug blocks my work",
    },
    {
      type: "pr",
      from: "nostrize",
      to: "nostrize/extension",
      pull: 16,
      created_at: agoInSeconds({ hours: 4 }),
      amountSats: 2100,
      message: "We need more pair of eyes 👀 to review this PR please",
    },
    {
      type: "repo",
      from: "dhalsim",
      to: "nostrize/extension",
      created_at: agoInSeconds({ hours: 3 }),
      amountSats: 2000,
      message:
        "Best browser extension? I received too many zaps ⚡️⚡️⚡️ because I'm a nostrich, too",
    },
    {
      type: "repo",
      from: "nostrize",
      to: "dhalsim/imgui-dom",
      created_at: agoInSeconds({ hours: 5 }),
      amountSats: 3000,
      message:
        "My favourite library, thanks for the quality software. Created a copy of it and used to develop nostize extension UI with it",
    },
    {
      type: "user",
      from: "dhalsim",
      to: "nostrband",
      created_at: agoInSeconds({ hours: 2 }),
      amountSats: 3500,
      message: "I'm fan of nostr.band, keep up the good work!",
    },
    {
      type: "repo",
      from: "nostrize",
      to: "nbd-wtf/nostr-tools",
      created_at: agoInSeconds({ hours: 34 }),
      amountSats: 21000,
      message:
        "One of the coolest nostr software out there 😎 a must have for every client developer",
    },
  ];

  const getGithubTitle = (url) =>
    getOrInsertPageCache({
      key: `nostrize-title-${url}`,
      insertCallback: () => fetchGithubTitle(url),
    });

  const typesNeedToBeFetch = ["issue", "pr"];

  const boostItemsPromiseAll = boosts.map(async (b) => {
    const url = githubUrlFor(b.type)({
      to: b.to,
      issue: b.issue,
      pull: b.pull,
    });

    const title = typesNeedToBeFetch.some((x) => x === b.type)
      ? await getGithubTitle(url)
      : b.to;

    const getTypeIcon = ({ type, user, log }) => {
      switch (type) {
        case "pr":
          return prIcon;
        case "issue":
          return issueIcon;
        case "org":
          return getIconComponent({
            user,
            isOrg: true,
            log,
          });
        case "user":
          return getIconComponent({
            user,
            log,
          });
        case "repo":
          return getIconComponent({
            user: user.split("/")[0],
            log,
          });
        default:
          return html.span();
      }
    };

    const fromIcon = await getTypeIcon({
      type: "user", // from type is always user
      user: b.from,
      log,
    });

    const toIcon = await getTypeIcon({
      type: b.type,
      user: b.to,
      log,
    });

    const boostItemInfo = html.div({
      classList: "n-boost-info",
      children: [
        html.div({
          style: [["width", "100%"]],
          children: [
            spanSpaced({
              classList: "n-boost-item-emoji",
              text: pickRandomEmoji(typeToReactions(b.type)),
            }),
            html.link({
              text: b.from,
              prepend: [fromIcon],
              href: githubUrlFor("user")({ to: b.from }),
              classList: "n-boost-from",
            }),
            spanSpaced({ text: "boosted" }),
            html.link({
              text: title,
              prepend: [toIcon],
              href: url,
              classList: `n-boost-to n-boost-type-${b.type}`,
            }),
            spanSpaced({ text: "for" }),
            spanSpaced({ text: b.amountSats, classList: "n-boost-sats" }),
            spanSpaced({ text: "sats!" }),
          ],
        }),
        html.span({
          classList: "n-boost-item-ago",
          text: timeAgo(b.created_at),
        }),
      ],
    });

    return html.div({
      classList: "n-boost-item",
      children: [
        boostItemInfo,
        html.div({
          classList: "n-boost-message-container",
          children: [
            html.div({ text: b.message, classList: "n-boost-message" }),
          ],
        }),
      ],
    });
  });

  const boostItems = await Promise.all(boostItemsPromiseAll);

  gui.prepend(
    gui.gebid("dashboard"),
    html.div({
      children: [
        html.div({
          classList: "n-boost-panel",
          children: [
            html.div({
              classList: "n-boost-title-container",
              children: [html.h2({ text: "↑ Nostrize Booster ↑" })],
            }),
            html.div({
              classList: "n-boost-items-container",
              children: boostItems,
            }),
            html.div({ text: "Load more..." }),
          ],
        }),
      ],
    }),
  );
}

githubBoostPanel().catch(console.log);
