import { getOrInsertCache } from "../../helpers/local-cache.js";
import * as gui from "../../imgui-dom/gui.js";
import * as html from "../../imgui-dom/html.js";

import {
  ago,
  fetchGithubTitle,
  githubUrlFor,
  linkSpaced,
  pickRandomEmoji,
  relativeTime,
  spanSpaced,
  typeToReactions,
} from "./boost-helpers.js";

async function githubBoostPanel() {
  const boosts = [
    {
      type: "org",
      from: "dhalsim",
      to: "nostr-protocol",
      created_at: ago(1),
      amountSats: 5000,
      message: "Respect to the OGs",
    },
    {
      type: "issue",
      from: "dhalsim",
      to: "nostrize/extension",
      issue: 2,
      created_at: ago(2),
      amountSats: 21000,
      message: "Please someone help me 😭, this bug blocks my work",
    },
    {
      type: "pr",
      from: "nostrize",
      to: "nostrize/extension",
      pull: 16,
      created_at: ago(4),
      amountSats: 2100,
      message: "We need more pair of eyes 👀 to review this PR please",
    },
    {
      type: "repo",
      from: "dhalsim",
      to: "nostrize/extension",
      created_at: ago(3),
      amountSats: 2000,
      message:
        "Best browser extension? I received too many zaps ⚡️⚡️⚡️ because I'm a nostrian now",
    },
    {
      type: "repo",
      from: "nostrize",
      to: "dhalsim/imgui-dom",
      created_at: ago(5),
      amountSats: 3000,
      message:
        "My favourite library, thanks for the quality software. Created a copy of it and used to develop nostize extension UI with it",
    },
    {
      type: "user",
      from: "dhalsim",
      to: "nostrband",
      created_at: ago(2),
      amountSats: 3500,
      message: "I'm fan of nostr.band, keep up the good work!",
    },
    {
      type: "repo",
      from: "nostrize",
      to: "nbd-wtf/nostr-tools",
      created_at: ago(34),
      amountSats: 21000,
      message:
        "One of the coolest nostr software out there 😎 a must have for every client developer",
    },
  ];

  const getGithubTitle = (url) =>
    getOrInsertCache({
      key: url,
      insertCallback: () => fetchGithubTitle(url),
      removeInDays: 1,
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

    return html.div({
      classList: "n-boost-item",
      children: [
        html.div({
          classList: "n-boost-info",
          children: [
            spanSpaced({ text: pickRandomEmoji(typeToReactions(b.type)) }),
            linkSpaced({
              text: b.from,
              href: githubUrlFor("user")({ to: b.from }),
              classList: "n-boost-from",
            }),
            spanSpaced({ text: "boosted" }),
            linkSpaced({
              text: title,
              href: url,
              classList: `n-boost-to n-boost-type-${b.type}`,
            }),
            spanSpaced({ text: "for" }),
            spanSpaced({ text: b.amountSats, classList: "n-boost-sats" }),
            spanSpaced({ text: "sats!" }),
          ],
        }),
        html.div({
          classList: "n-boost-message-container",
          children: [
            html.div({ text: b.message, classList: "n-boost-message" }),
          ],
        }),
        relativeTime(b.created_at),
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
          ],
        }),
      ],
    }),
  );
}

githubBoostPanel().catch(console.log);
