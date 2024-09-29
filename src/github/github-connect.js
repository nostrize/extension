import * as html from "../imgui-dom/html.js";
import { fetchFromNip05 } from "../helpers/nostr.js";
import { Either } from "../helpers/either.ts";
import { getOrInsertPageCache } from "../helpers/local-cache.js";
import { pickRandomEmoji } from "./feed/boost-helpers.js";

export async function getGithubConnectData({ user, log }) {
  log("trying to reach github connect nostr.json");
  // if the repo name is kept as the fork
  let res = await fetchFromNip05({
    user,
    fetchUrl: `https://${user}.github.io/github-connect/.well-known/nostr.json?user=${user}`,
  });

  if (Either.isRight(res)) {
    return res;
  }

  log(Either.getLeft(res));
  log("trying the short url version");

  // if the repo is renamed to [username].github.io
  res = await fetchFromNip05({
    user,
    fetchUrl: `https://${user}.github.io/.well-known/nostr.json?user=${user}`,
  });

  if (Either.isRight(res)) {
    return res;
  }

  return Either.left(`coulnd't find github-connect for user ${user}`);
}

export async function getIconComponent({ user, isOrg = false, log }) {
  const githubConnectData = await getOrInsertPageCache({
    key: `nostrize-github-connect-${user}`,
    insertEmpty: true,
    insertCallback: () =>
      getGithubConnectData({ user, log }).then(Either.getOrElse(null)),
  });

  const empty = html.span({
    text: isOrg ? "👥" : pickRandomEmoji("🧑 🧑 🧑‍🏭 👷‍♂️"),
  });

  if (!githubConnectData) {
    return empty;
  }

  const { extension } = githubConnectData;

  if (!extension) {
    return html.span();
  }

  const { icon, emoji } = extension;

  if (icon) {
    return html.span({
      innerHTML: `<img src="${icon}" alt="${user}" style="width: 16px; height: 16px; vertical-align: -3px;">`,
    });
  }

  if (emoji) {
    return html.span({ text: emoji });
  }

  return empty;
}
