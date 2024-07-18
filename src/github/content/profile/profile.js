import { logger } from "../../../helpers/logger.js";
import { fetchLud16AndLud06 } from "./helper.js";
import { div, link, span } from "../../../imgui-dom/src/html.js";

function prepend(parent, element) {
  var childElements = [...parent.children];

  for (let i = 0; i < childElements.length; i++) {
    console.log(childElements[i].nodeName);
  }

  parent.append(element);

  for (let i = 0; i < childElements.length; i++) {
    parent.append(childElements[i]);
  }
}

async function githubProfilePage() {
  const { settings } = await chrome.storage.sync.get(["settings"]);

  settings.debug.namespace = "[N][Profile]";

  const pathParts = window.location.pathname
    .split("/")
    .filter((part) => part.length > 0);

  // Assuming the URL pattern is https://github.com/{user}
  if (pathParts.length !== 1) {
    return;
  }

  const log = logger(settings.debug);

  const user = pathParts[0];

  log("user", user);

  const fetchUrl = `https://${user}.github.io/github-connect/.well-known/nostr.json?user=${user}`;

  let response;

  try {
    response = await fetch(fetchUrl);
  } catch (error) {
    log("nip05 fetch error", error);
  }

  if (response.ok) {
    const json = await response.json();
    const npub = json["names"][user];

    log("npub", npub);

    if (!npub) {
      log(`could not fetch user ${user}`);

      return;
    }

    try {
      const subscriptionId =
        "SubsIdNostrize" + Math.round(Math.random() * 10000);

      const [lud16, lud06] = await fetchLud16AndLud06({
        log,
        npub,
        relayUrl: "wss://relay.damus.io",
        subscriptionId,
      });

      log(lud16, lud06);

      if (!lud16 && !lud06) {
        log("couldnt fetch lud16 or lud06");

        return;
      }

      const vcardContainer = document.querySelector(
        "div.vcard-names-container",
      );

      const zapButton = div({
        id: "n-zap-button",
        children: [
          div({
            classList: "n-tooltip-container n-zap-emoji",
            children: [
              link({
                classList: "no-underline Button",
                href: "javascript:void(0)",
                onclick: () => log("clicked zap to", lud16 || lud06),
                text: "⚡",
              }),
              span({
                classList: "n-tooltiptext",
                text: "Zap this user",
              }),
            ],
          }),
        ],
      });

      prepend(vcardContainer, zapButton);
    } catch (error) {
      log("fetch profile error", error);
    }
  } else {
    log(response.status);
  }
}

githubProfilePage();
