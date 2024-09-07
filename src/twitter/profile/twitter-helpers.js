import * as gui from "../../imgui-dom/gui.js";
import * as html from "../../imgui-dom/html.js";
import { setupModal } from "../../components/common.js";
import { fetchLatestNotes } from "../../helpers/nostr.js";
import { wrapCheckbox } from "../../components/checkbox/checkbox-wrapper.js";
import { wrapInputTooltip } from "../../components/tooltip/tooltip-wrapper.js";
import { timeAgo } from "../../helpers/time.js";
import { nip19 } from "nostr-tools";

export const updateFollowButton = (button, emojiIcon) => {
  button.childNodes[0].childNodes[0].textContent = emojiIcon;
};

export const createTwitterButton = (buttonTobeCloned, accountName, options) => {
  const button = buttonTobeCloned.cloneNode(true);

  button.id = options.id;
  button.href = "javascript:void(0)";
  button.childNodes[0].childNodes[0].remove();
  button.childNodes[0].childNodes[0].textContent = options.emojiIcon;
  button.setAttribute("data-for-account", accountName);

  button.addEventListener("mouseenter", () => {
    button.style.backgroundColor = "rgb(130, 80, 223)";
  });

  button.addEventListener("mouseleave", () => {
    button.style.backgroundColor = "black";
  });

  button.onclick = async () => {
    const res = await options.modalComponentFn();

    if (!res) {
      return;
    }

    const { modal, closeModal } = res;

    setupModal(modal, closeModal);
  };

  return button;
};

const shortenNote = (maxLength) => (content) => {
  if (content.length <= maxLength) {
    return content;
  }

  const shortContent = content.slice(0, maxLength);
  const remainingContent = content.slice(maxLength);

  return `${shortContent}...
          <span class="shortened-content" style="display: none;">${remainingContent}</span>
          <a href="javascript:void(0);" class="load-more">Load More</a>`;
};

// Add this function to handle the click event
const handleLoadMore = (event) => {
  event.preventDefault();
  console.log("TEST");
  event.target.previousElementSibling.style.display = "inline";
  event.target.style.display = "none";
};

// Add this function to attach event listeners after the content is added to the DOM
const attachLoadMoreListeners = () => {
  document.querySelectorAll(".load-more").forEach((link) => {
    link.addEventListener("click", handleLoadMore);
  });
};

function processNoteContent(content, openNostr) {
  // Basic processing: escape HTML, convert URLs to links, handle newlines, and process Nostr event IDs
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/(https?:\/\/\S+)(?=\s|$)/g, (match) => {
      const hasNewlineAfter = match.endsWith("\n");
      const cleanUrl = match.replace(/\n+$/, "");
      let result = "";
      if (cleanUrl.match(/\.(jpg|jpeg|png|gif)$/i)) {
        result = `<img src="${cleanUrl}" alt="Image">`;
      } else {
        result = `<a href="${cleanUrl}" target="_blank">${cleanUrl}</a>`;
      }
      return hasNewlineAfter ? result + "<br />" : result;
    })
    .replace(/\b(nostr:)?(nevent1[a-zA-Z0-9]+)/g, (match, prefix, eventId) => {
      const shortEventId = match.slice(0, 15) + "...";

      return `<a href="${openNostr}/${eventId}" target="_blank">${shortEventId}</a>`;
    })
    .replace(/\n/g, "<br />");
}

async function setNostrMode({
  enabled,
  pageUserPubkey,
  pageUserWriteRelays,
  openNostr,
}) {
  if (enabled) {
    const latestNotes = fetchLatestNotes({
      pubkey: pageUserPubkey,
      relays: pageUserWriteRelays,
      callback: (event, index) => {
        notesSection.insertBefore(
          createNote(event, openNostr),
          notesSection.children[index],
        );
      },
    });

    const notesSection = gui.gebid("n-tw-notes-section");
    notesSection.style.display = "flex";

    latestNotes
      // filter out notes that are replies to nostr events
      .filter((e) => !e.tags.some((tag) => tag[0] === "e"))
      .forEach((note) => {
        notesSection.appendChild(createNote(note, openNostr));
      });

    attachLoadMoreListeners();
  } else {
    const notesSection = gui.gebid("n-tw-notes-section");
    notesSection.style.display = "none";
  }
}

const createNote = (event, openNostr) => {
  const eventId = nip19.noteEncode(event.id);

  return html.div({
    classList: "n-tw-note",
    children: [
      html.div({
        classList: "n-tw-note-content",
        innerHTML: shortenNote(500)(
          processNoteContent(event.content, openNostr),
        ),
      }),
      html.link({
        classList: "ago",
        text: timeAgo(event.created_at),
        href: `${openNostr}/${eventId}`,
        targetBlank: true,
      }),
    ],
  });
};

export function setupNostrMode({
  timelineNavbar,
  pageUserPubkey,
  pageUserWriteRelays,
  settings,
}) {
  const nostrModeOnclick = async (checked) => {
    if (checked) {
      timelineNavbar.style.display = "none";
    } else {
      timelineNavbar.style.display = "flex";
    }

    await setNostrMode({
      enabled: checked,
      pageUserPubkey,
      pageUserWriteRelays,
      openNostr: settings.nostrSettings.openNostr,
    });
  };

  const enableNostrModeCheckbox = wrapCheckbox({
    input: html.input({
      type: "checkbox",
      id: "n-tw-enable-nostr-mode",
      checked: true,
    }),
    onclick: nostrModeOnclick,
    text: "Enable Nostr Mode",
  });

  timelineNavbar.insertAdjacentElement("beforebegin", enableNostrModeCheckbox);

  const notesSection = html.div({
    id: "n-tw-notes-section",
    style: [["display", "none"]],
  });

  enableNostrModeCheckbox.insertAdjacentElement("afterend", notesSection);

  // nostr mode is on by default
  nostrModeOnclick(true);

  return { enableNostrModeCheckbox, notesSection };
}

export function setupNostrProfileLink(settings, pageUserPubkey) {
  const usernamePanel = document.querySelector("div[data-testid='UserName']");
  const handleContainer =
    usernamePanel?.childNodes[0]?.childNodes[0]?.childNodes[0]?.childNodes[1];
  const handle = handleContainer?.childNodes[0];

  if (!handle) {
    return handleContainer;
  }

  const handleContent = handle.textContent;

  if (handleContainer) {
    const nostrProfileLink = wrapInputTooltip({
      id: "n-tw-nostr-profile-button",
      input: html.link({
        text: handleContent,
        href: `${settings.nostrSettings.openNostr}/${pageUserPubkey}`,
        targetBlank: true,
      }),
      tooltipText: `User is on Nostr. Click to open Nostr profile.`,
    });

    handle.style.display = "none";

    gui.prepend(handleContainer, nostrProfileLink);
  }

  return handleContainer;
}
