import { wrapCheckbox } from "../components/checkbox/checkbox-wrapper.js";
import {
  getLocalSettings,
  saveLocalSettings,
  defaultSettings,
} from "../helpers/local-cache.js";

async function settingsPage() {
  const state = await getLocalSettings();

  // Load state into UI
  function loadState() {
    document.getElementById("version-number").textContent = state.version;

    // Load Debug Settings
    document.getElementById("log").checked = state.debug.log;
    if (state.debug.log) {
      document
        .getElementById("log")
        .nextElementSibling.classList.add("checked");
    }
    document.getElementById("namespace").value = state.debug.namespace;

    // Load Nostr Settings
    document.getElementById("open-nostr").value = state.nostrSettings.openNostr;

    document.getElementById("mode").value = state.nostrSettings.mode;
    document.getElementById("nip07-relays").checked =
      state.nostrSettings.nip07.useRelays;

    if (state.nostrSettings.nip07.useRelays) {
      document
        .getElementById("nip07-relays")
        .nextElementSibling.classList.add("checked");
    }

    const relaysList = document.getElementById("relays-list");
    relaysList.innerHTML = ""; // Clear existing list

    state.nostrSettings.relays.forEach((relay, index) => {
      const relayItem = createRelayItem(relay, index);
      relaysList.appendChild(relayItem);
    });

    toggleNIP07Settings();

    // Load Lightsats Settings
    document.getElementById("lightsats-api-key").value =
      state.lightsatsSettings.apiKey;
    document.getElementById("lightsats-enable").checked =
      state.lightsatsSettings.enabled;

    if (state.lightsatsSettings.enabled) {
      document
        .getElementById("lightsats-enable")
        .nextElementSibling.classList.add("checked");
    }
  }

  // Create a relay item element
  function createRelayItem(relay, index) {
    const li = document.createElement("li");
    li.classList.add("relay-item");

    const input = document.createElement("input");
    input.type = "text";
    input.value = relay;
    input.onchange = (e) =>
      (state.nostrSettings.relays[index] = e.target.value);

    const button = document.createElement("button");
    button.textContent = "Remove";
    button.classList.add("remove-relay");
    button.onclick = () => removeRelay(index);

    li.appendChild(input);
    li.appendChild(button);

    return li;
  }

  function removeRelay(index) {
    state.nostrSettings.relays.splice(index, 1);

    loadState();
  }

  function addRelay() {
    state.nostrSettings.relays.push("");

    loadState();
  }

  function toggleNIP07Settings() {
    const nip07Settings = document.getElementById("nip07-settings");

    nip07Settings.style.display =
      state.nostrSettings.mode === "nip07" ? "flex" : "none";
  }

  // Reset settings to default
  function resetSettings() {
    // Debug settings
    state.debug.log = defaultSettings.debug.log;
    state.debug.namespace = defaultSettings.debug.namespace;

    // Nostr settings
    state.nostrSettings.mode = defaultSettings.nostrSettings.mode;

    state.nostrSettings.nip07.useRelays =
      defaultSettings.nostrSettings.nip07.useRelays;
    state.nostrSettings.relays = [...defaultSettings.nostrSettings.relays];
    state.nostrSettings.openNostr = defaultSettings.nostrSettings.openNostr;

    // Lightsats settings
    state.lightsatsSettings.apiKey = defaultSettings.lightsatsSettings.apiKey;
    state.lightsatsSettings.enabled = defaultSettings.lightsatsSettings.enabled;

    loadState();
  }

  async function saveSettings() {
    state.nostrSettings.relays = [
      ...new Set(state.nostrSettings.relays),
    ].filter(String);

    await saveLocalSettings({ settings: state });

    const notification = document.getElementById("saved-notification");
    notification.style.display = "inline";

    setTimeout(() => (notification.style.display = "none"), 2000);

    loadState();
  }

  // Load custom checkbox: Debug
  const debugCheckbox = document.getElementById("log");

  const wrappedLogCheckbox = wrapCheckbox({
    input: debugCheckbox,
    text: "Enable Logging",
    onclick: (checked) => {
      state.debug.log = checked;
    },
  });

  document
    .getElementById("debug-settings-logging")
    .appendChild(wrappedLogCheckbox);

  // Load custom checkbox: Use NIP07 Relays
  const nip07RelaysCheckbox = document.getElementById("nip07-relays");

  const wrappedNip07RelaysCheckbox = wrapCheckbox({
    input: nip07RelaysCheckbox,
    text: "Use relays from NIP07 extension",
    onclick: (checked) => {
      state.nostrSettings.nip07.useRelays = checked;
    },
  });

  document
    .getElementById("nip07-settings")
    .appendChild(wrappedNip07RelaysCheckbox);

  // Load custom checkbox: Lightsats integration
  const lightsatsCheckbox = document.getElementById("lightsats-enable");

  const wrappedCheckbox = wrapCheckbox({
    input: lightsatsCheckbox,
    text: "Enable Lightsats",
    onclick: (checked) => {
      state.lightsatsSettings.enabled = checked;
    },
  });

  document
    .getElementById("lightsats-integration")
    .appendChild(wrappedCheckbox)
    .appendChild(document.querySelector("label[for='lightsats-enable']"));

  // Attach event listeners
  // Debug settings
  document.getElementById("namespace").onchange = (e) =>
    (state.debug.namespace = e.target.value);

  // Nostr settings
  document.getElementById("mode").onchange = (e) => {
    state.nostrSettings.mode = e.target.value;

    toggleNIP07Settings();
  };

  document.getElementById("open-nostr").onchange = (e) =>
    (state.nostrSettings.openNostr = e.target.value);

  document.getElementById("add-relay").onclick = addRelay;

  // Lightsats settings
  document.getElementById("lightsats-api-key").onchange = (e) =>
    (state.lightsatsSettings.apiKey = e.target.value);

  // Save/Reset settings
  document.getElementById("reset-settings").onclick = resetSettings;
  document.getElementById("save-settings").onclick = saveSettings;

  // Tooltips
  document.querySelectorAll(".help-icon").forEach((icon) => {
    icon.addEventListener("mouseenter", () => {
      const tooltip = icon.nextElementSibling;
      if (tooltip) {
        // Show the tooltip to measure its position
        tooltip.style.display = "block";

        // Get the bounding rectangle of the tooltip and the icon
        const tooltipRect = tooltip.getBoundingClientRect();
        // Check if the tooltip is going off the top of the screen
        if (tooltipRect.top < 0) {
          tooltip.classList.add("below");
        } else {
          tooltip.classList.remove("below");
        }
      }
    });

    icon.addEventListener("mouseleave", () => {
      const tooltip = icon.nextElementSibling;
      if (tooltip) {
        // Hide the tooltip when not hovering
        tooltip.style.display = "none";
      }
    });
  });

  // Collapsable sections
  document.querySelectorAll(".section.collapsable").forEach((collapsable) => {
    const header = collapsable.querySelector("h2");

    header.addEventListener("click", () => {
      header.classList.toggle("collapsed");
      header.classList.toggle("expanded");

      const inputContainer = collapsable.querySelector(".input-container");
      inputContainer.classList.toggle("collapsed");
      inputContainer.classList.toggle("expanded");
    });
  });

  // Load the state initially
  loadState();
}

settingsPage().catch(console.log);
