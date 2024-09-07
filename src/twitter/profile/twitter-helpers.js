import * as gui from "../../imgui-dom/gui.js";
import * as html from "../../imgui-dom/html.js";
import { setupModal } from "../../components/common.js";
import { fetchLatestNotes } from "../../helpers/nostr.js";
import { delay } from "../../helpers/utils.js";

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
          <span id="shortened-content" style="display: none;">${remainingContent}</span>
          <a href="javascript:void(0);" 
             onclick="
               event.preventDefault(); 
               this.previousElementSibling.style.display = 'inline'; 
               this.style.display = 'none';
             ">
             Load More
          </a>`;
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

export async function setNostrMode(
  enabled,
  accountPubkey,
  writeRelays,
  openNostr,
) {
  if (enabled) {
    const trimNote = shortenNote(500);

    const latestNotes = fetchLatestNotes({
      pubkey: accountPubkey,
      relays: writeRelays,
      callback: (event, index) => {
        notesSection.insertBefore(
          html.div({
            classList: "tw-note",
            innerHTML: trimNote(processNoteContent(event.content, openNostr)),
          }),
          notesSection.children[index],
        );
      },
    });

    const notesSection = gui.gebid("n-tw-notes-section");
    notesSection.style.display = "flex";

    latestNotes.forEach((note) => {
      notesSection.appendChild(
        html.div({
          classList: "tw-note",
          innerHTML: trimNote(processNoteContent(note.content, openNostr)),
        }),
      );
    });
  } else {
    const notesSection = gui.gebid("n-tw-notes-section");
    notesSection.style.display = "none";

    // TODO: set twitter section display to flex
  }
}

export async function addAccountNotesTab(
  accountPubkey,
  writeRelays,
  openNostr,
) {
  const tablist = document.querySelector(
    "[data-testid='ScrollSnap-SwipeableList']",
  ).childNodes[0];

  // deselect posts tab
  const posts = tablist.childNodes[0];
  posts.querySelector("span").nextElementSibling.style.backgroundColor =
    "unset";

  // reset account notes tab
  const accountNotes = posts.cloneNode(true);
  accountNotes.id = "n-tw-account-notes";

  // remove link
  accountNotes.childNodes[0].setAttribute("href", "javascript:void(0);");

  gui.prepend(tablist, accountNotes);

  const notesTitle = accountNotes.querySelector("span");
  notesTitle.textContent = "Notes";

  const selectionIndicator = notesTitle.nextElementSibling;
  selectionIndicator.style.backgroundColor = "unset";

  await notesTabClicked();

  const trimNote = shortenNote(500);

  let toHide = document.querySelector('[aria-labelledby="accessible-list-1"]');

  while (!toHide) {
    await delay(100);
    toHide = document.querySelector('[aria-labelledby="accessible-list-1"]');
  }

  toHide.style.display = "none";

  const notesSection = html.div({
    id: "n-tw-notes-section",
    classList: "n-tw-notes-section",
  });

  toHide.insertAdjacentElement("afterend", notesSection);

  const latestNotes = fetchLatestNotes({
    pubkey: accountPubkey,
    relays: writeRelays,
    callback: (event, index) => {
      if (isAccountNotesTabSelected) {
        notesSection.insertBefore(
          html.div({
            classList: "tw-note",
            innerHTML: trimNote(processNoteContent(event.content, openNostr)),
          }),
          notesSection.children[index],
        );
      }
    },
  });

  let isAccountNotesTabSelected = false;

  tablist.childNodes.forEach((node) => {
    if (node.id === "n-tw-account-notes") {
      return;
    }

    node.addEventListener("click", () => {
      isAccountNotesTabSelected = false;
      notesSection.style.display = "none";
      selectionIndicator.style.backgroundColor = "unset";
      toHide.style.display = "flex";
    });
  });

  const notesTabClicked = async (e) => {
    e?.preventDefault();

    isAccountNotesTabSelected = true;

    selectionIndicator.style.backgroundColor = "rgb(130, 80, 223)";

    // clear notes section
    notesSection.innerHTML = "";

    latestNotes.forEach((note) => {
      notesSection.appendChild(
        html.div({
          classList: "tw-note",
          innerHTML: trimNote(processNoteContent(note.content, openNostr)),
        }),
      );
    });
  };

  accountNotes.addEventListener("click", notesTabClicked);

  accountNotes.addEventListener("mouseenter", () => {
    accountNotes.style.backgroundColor = "rgb(130, 80, 223)";
  });

  accountNotes.addEventListener("mouseleave", () => {
    accountNotes.style.backgroundColor = "unset";
  });
}
