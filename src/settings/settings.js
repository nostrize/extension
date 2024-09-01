import {
  getLocalSettings,
  saveLocalSettings,
  defaultSettings,
} from "../helpers/local-cache.js";

async function settingsPage() {
  const state = await getLocalSettings();

  // Load state into UI
  function loadState() {
    // Load Debug Settings
    document.getElementById("log").checked = state.debug.log;
    document.getElementById("namespace").value = state.debug.namespace;

    // Load Nostr Settings
    document.getElementById("mode").value = state.nostrSettings.mode;
    document.getElementById("nip07-relays").checked =
      state.nostrSettings.nip07.useRelays;

    const relaysList = document.getElementById("relays-list");
    relaysList.innerHTML = ""; // Clear existing list

    state.nostrSettings.relays.forEach((relay, index) => {
      const relayItem = createRelayItem(relay, index);
      relaysList.appendChild(relayItem);
    });

    toggleNIP07Settings();
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

  // Attach event listeners
  document.getElementById("log").onchange = (e) =>
    (state.debug.log = e.target.checked);

  document.getElementById("namespace").onchange = (e) =>
    (state.debug.namespace = e.target.value);

  document.getElementById("mode").onchange = (e) => {
    state.nostrSettings.mode = e.target.value;

    toggleNIP07Settings();
  };

  document.getElementById("nip07-relays").onchange = (e) =>
    (state.nostrSettings.nip07.useRelays = e.target.checked);

  document.getElementById("add-relay").onclick = addRelay;
  document.getElementById("reset-settings").onclick = resetSettings;
  document.getElementById("save-settings").onclick = saveSettings;

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
