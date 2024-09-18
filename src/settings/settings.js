import * as html from "../imgui-dom/html.js";
import {
  getLocalSettings,
  saveLocalSettings,
  defaultSettings,
} from "../helpers/local-cache.js";

import NIP65RelayManager from "./nip65.svelte";
import DebugSettings from "./debug.svelte";
import LightsatsSettings from "./lightsats.svelte";
import NostrSettings from "./nostr.svelte";

async function settingsPage() {
  const state = await getLocalSettings();

  // Load state into UI
  function loadState() {
    document.getElementById("version-number").textContent = state.version;
  }

  // Reset settings to default
  function resetSettings() {
    // TODO: do it in svelte way

    // Debug settings
    state.debug.log = defaultSettings.debug.log;
    state.debug.namespace = defaultSettings.debug.namespace;

    // Nostr settings
    state.nostrSettings.mode = defaultSettings.nostrSettings.mode;

    state.nostrSettings.nip07.useRelays =
      defaultSettings.nostrSettings.nip07.useRelays;
    state.nostrSettings.relays = [...defaultSettings.nostrSettings.relays];
    state.nostrSettings.openNostr = defaultSettings.nostrSettings.openNostr;

    loadState();
  }

  async function saveSettings() {
    state.nostrSettings.relays = [
      ...new Set(state.nostrSettings.relays),
    ].filter(String);

    await saveLocalSettings({ settings: state });

    const saveButton = document.getElementById("save-settings");
    saveButton.textContent = "Saved";

    setTimeout(() => (saveButton.textContent = "Save settings"), 2000);

    loadState();
  }
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

  const icons = document.querySelectorAll(".sidebar .icon");
  const sections = document.querySelectorAll("main section");

  icons.forEach((icon) => {
    icon.addEventListener("click", function () {
      const sectionName = this.dataset.section;

      // Remove active class from all icons and sections
      icons.forEach((i) => i.classList.remove("active"));
      sections.forEach((s) => s.classList.remove("active"));

      // Add active class to clicked icon and corresponding section
      this.classList.add("active");
      document.getElementById(`${sectionName}-section`).classList.add("active");
    });
  });

  // Load NIP-65 Manager into tools section
  const nip65Container = document.getElementById(
    "nip65-relay-manager-container",
  );

  if (state.nostrSettings.mode === "nip07") {
    nip65Container.append(
      html.link({
        href: "https://nostrize.me/pages/nip65-manager.html",
        targetBlank: true,
        text: "Click to edit NIP-65 relays",
      }),
    );
  } else if (state.nostrSettings.mode === "nostrconnect") {
    new NIP65RelayManager({
      target: nip65Container,
      props: {
        state,
      },
    });
  } else {
    nip65Container.append(
      html.span({
        text: `Cannot edit NIP-65 relays when in ${state.nostrSettings.mode} mode`,
      }),
    );
  }

  // Load Debug Settings
  const debugContainer = document.getElementById("debug-settings-container");

  if (debugContainer) {
    new DebugSettings({
      target: debugContainer,
      props: { debugSettings: state.debug },
    });
  }

  // Load Lightsats Settings
  const lightsatsContainer = document.getElementById(
    "lightsats-settings-container",
  );

  if (lightsatsContainer) {
    new LightsatsSettings({
      target: lightsatsContainer,
      props: { lightsatsSettings: state.lightsatsSettings },
    });
  }

  // Load Nostr Settings
  const nostrContainer = document.getElementById("nostr-settings-container");

  if (nostrContainer) {
    new NostrSettings({
      target: nostrContainer,
      props: { nostrSettings: state.nostrSettings },
    });
  }

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
