import SettingsWrapper from "./settings-wrapper.svelte";

async function settingsPage() {
  const settingsContainer = document.getElementById("settings-container");

  new SettingsWrapper({
    target: settingsContainer,
  });
}

settingsPage().catch(console.log);
