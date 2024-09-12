import { nip19 } from "nostr-tools";

import * as gui from "../../imgui-dom/gui.js";
import * as html from "../../imgui-dom/html.js";
import { setupModal } from "../../components/common.js";
import { fetchLatestNotes, getMetadataEvent } from "../../helpers/nostr.js";
import { wrapCheckbox } from "../../components/checkbox/checkbox-wrapper.js";
import { wrapInputTooltip } from "../../components/tooltip/tooltip-wrapper.js";
import { timeAgo } from "../../helpers/time.js";

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

const shortenNote = (maxWords) => (content) => {
  const words = content.split(/(\s+)/);
  let wordCount = 0;
  let charIndex = 0;

  for (let i = 0; i < words.length; i++) {
    if (words[i].trim().length > 0) {
      wordCount++;
    }
    if (wordCount > maxWords) {
      charIndex = words.slice(0, i).join("").length;
      break;
    }
    if (i === words.length - 1) {
      return content; // Return full content if word count doesn't exceed maxWords
    }
  }

  const shortContent = content.slice(0, charIndex);
  const remainingContent = content.slice(charIndex);

  return `${shortContent}...
          <span class="shortened-content" style="display: none;">${remainingContent}</span>
          <a href="javascript:void(0);" class="show-more">Show More</a>
          <a href="javascript:void(0);" class="show-less" style="display: none;">Show Less</a>`;
};

// Update this function to handle both Show More and Show Less
const handleShowMoreLess = (event) => {
  event.preventDefault();

  const noteContent = event.target.closest(".n-tw-note-content");
  const shortenedContent = noteContent.querySelector(".shortened-content");
  const showMoreLink = noteContent.querySelector(".show-more");
  const showLessLink = noteContent.querySelector(".show-less");

  if (event.target.classList.contains("show-more")) {
    shortenedContent.style.display = "inline";
    showMoreLink.style.display = "none";
    showLessLink.style.display = "inline";
  } else if (event.target.classList.contains("show-less")) {
    shortenedContent.style.display = "none";
    showMoreLink.style.display = "inline";
    showLessLink.style.display = "none";

    // Scroll back to the top of the note
    noteContent.scrollIntoView({ behavior: "smooth", block: "start" });

    // Add blinking effect
    const originalColor = noteContent.style.backgroundColor;
    noteContent.style.transition = "background-color 0.5s";

    const blink = (count) => {
      if (count > 0) {
        noteContent.style.backgroundColor = "yellowgreen";

        setTimeout(() => {
          noteContent.style.backgroundColor = originalColor;

          setTimeout(() => blink(count - 1), 150);
        }, 150);
      } else {
        noteContent.style.transition = "";
      }
    };

    blink(3);
  }
};

// Update this function to attach listeners to both Show More and Show Less
const attachLoadMoreListeners = (element) => {
  element.querySelectorAll(".show-more, .show-less").forEach((link) => {
    link.addEventListener("click", handleShowMoreLess);
  });
};

// escape HTML, convert URLs to links, handle newlines, and process Nostr event IDs and npubs
async function replaceNoteContent(content, openNostr, relays) {
  let result = content.replace(/(https?:\/\/\S+)(?=\s|$)/g, (match) => {
    const hasNewlineAfter = match.endsWith("\n");
    const cleanUrl = match.replace(/\n+$/, "");

    let replacement = "";

    if (cleanUrl.match(/\.(jpg|jpeg|png|gif)$/i)) {
      replacement = `<img src="${cleanUrl}" alt="Image">`;
    } else {
      replacement = `<a href="${cleanUrl}" target="_blank">${cleanUrl}</a>`;
    }

    return hasNewlineAfter ? replacement + "<br />" : replacement;
  });

  // Then handle npubs
  const npubRegex = /\b(nostr:)?(npub1[a-zA-Z0-9]+)/g;
  const npubMatches = [...result.matchAll(npubRegex)];

  const decodedPubkeys = npubMatches.reduce(
    // eslint-disable-next-line no-unused-vars
    (acc, [match, prefix, npub]) => {
      try {
        const { data: pubkey } = nip19.decode(npub);

        acc.push({ match, npub, pubkey });
      } catch (error) {
        console.info(`Error decoding npub ${npub}:`, error.message);
      }

      return acc;
    },
    [],
  );

  const npubReplacements = await Promise.all(
    decodedPubkeys.map(async ({ match, npub, pubkey }) => {
      const profile = await getMetadataEvent({
        cacheKey: pubkey,
        relays,
        filter: { authors: [pubkey], kinds: [0], limit: 1 },
      });

      const displayName = JSON.parse(profile.content).display_name;

      return {
        original: match,
        replacement: `<a href="${openNostr}/${npub}" target="_blank">@${displayName}</a>`,
      };
    }),
  );

  for (const { original, replacement } of npubReplacements) {
    result = result.replace(original, replacement);
  }

  // Handle nostr event IDs
  result = result.replaceAll(
    /\b(nostr:)?(nevent1[a-zA-Z0-9]+)\b/g,
    (match, prefix, eventId) => {
      const shortEventId = eventId.slice(0, 13) + "...";
      return `<a href="${openNostr}/${eventId}" target="_blank">${shortEventId}</a>`;
    },
  );

  // Handle nostr note IDs
  result = result.replaceAll(
    /\b(nostr:)?(note1[a-zA-Z0-9]+)\b/g,
    (match, prefix, noteId) => {
      const shortNoteId = noteId.slice(0, 13) + "...";
      return `<a href="${openNostr}/${noteId}" target="_blank">${shortNoteId}</a>`;
    },
  );

  // Handle newlines
  result = result.replace(/\n/g, "<br />");

  return result;
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
      callback: async (event, index) => {
        const note = await createNote(event, openNostr, pageUserWriteRelays);

        notesSection.insertBefore(note, notesSection.children[index]);

        attachLoadMoreListeners(note);
      },
    });

    const notesSection = gui.gebid("n-tw-notes-section");
    notesSection.style.display = "flex";

    // Filter out replies
    const filteredNotes = latestNotes.filter(
      (e) => !e.tags.some((tag) => tag[0] === "e"),
    );

    for (const note of filteredNotes) {
      const noteElement = await createNote(
        note,
        openNostr,
        pageUserWriteRelays,
      );

      notesSection.appendChild(noteElement);
    }

    attachLoadMoreListeners(notesSection);
  } else {
    const notesSection = gui.gebid("n-tw-notes-section");
    notesSection.style.display = "none";
  }
}

const createNote = async (event, openNostr, relays) => {
  const eventId = nip19.noteEncode(event.id);

  // Escape HTML characters first
  const escapedContent = event.content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Then apply shortenNote
  const shortContent = await shortenNote(50)(escapedContent);

  // Finally, replace content with links, images, etc.
  const replacedContent = await replaceNoteContent(
    shortContent,
    openNostr,
    relays,
  );

  return html.div({
    classList: "n-tw-note",
    children: [
      html.div({
        classList: "n-tw-note-content",
        innerHTML: replacedContent,
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
      timelineNavbar.nextSibling.style.display = "none";
    } else {
      timelineNavbar.style.display = "flex";
      timelineNavbar.nextSibling.style.display = "flex";
    }

    await setNostrMode({
      enabled: checked,
      pageUserPubkey,
      pageUserWriteRelays,
      openNostr: settings.nostrSettings.openNostr,
    });
  };

  const enableNostrModeCheckbox = wrapCheckbox({
    id: "n-tw-enable-nostr-mode-checkbox",
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
}

export function setupNostrProfileLink(
  settings,
  pageUserPubkey,
  pageUserIsNostrizeUser,
  pageUserWriteRelays,
) {
  const usernamePanel = document.querySelector("div[data-testid='UserName']");
  const handleContainer =
    usernamePanel?.childNodes[0]?.childNodes[0]?.childNodes[0]?.childNodes[1];
  const handle = handleContainer?.childNodes[0];

  if (!handle) {
    return handleContainer;
  }

  const handleContent = handle.textContent;

  const nprofile = nip19.nprofileEncode({
    pubkey: pageUserPubkey,
    relays: pageUserWriteRelays,
  });

  if (handleContainer) {
    const nostrProfileLink = wrapInputTooltip({
      id: "n-tw-nostr-profile-button",
      input: html.link({
        text: handleContent,
        href: pageUserIsNostrizeUser
          ? "https://metadata.nostr.com/"
          : `${settings.nostrSettings.openNostr}/${nprofile}`,
        targetBlank: true,
      }),
      tooltipText: pageUserIsNostrizeUser
        ? "View/Update your Nostr profile"
        : "Click to open Nostr profile",
    });

    handle.style.display = "none";

    gui.prepend(handleContainer, nostrProfileLink);
  }

  return handleContainer;
}
