<script>
  import {
    saveNostrizeSettings,
    defaultSettings,
  } from "../helpers/local-cache.js";

  import NostrSettings from "./nostr.svelte";
  import LightsatsSettings from "./lightsats.svelte";
  import DebugSettings from "./debug.svelte";
  import NIP65RelayManager from "./nip65.svelte";

  export let settings;

  let lightsatsComponent;
  let nostrComponent;
  let debugComponent;

  let isDirtyLightsats = false;
  let isDirtyNostr = false;
  let isDirtyDebug = false;

  // won't be included in general isDirty, it doesn't belong to settings
  let isDirtyNIP65 = false;

  $: isDirty = isDirtyLightsats || isDirtyNostr || isDirtyDebug;

  $: isDefaultSettings =
    settings && JSON.stringify(settings) === JSON.stringify(defaultSettings);

  let lastSavedSettings = JSON.stringify(settings);

  let saveLabel = "Save settings";

  async function saveSettings() {
    await saveNostrizeSettings({ settings });

    lastSavedSettings = JSON.stringify(settings);

    lightsatsComponent.onSaveSettings();
    nostrComponent.onSaveSettings();
    debugComponent.onSaveSettings();

    saveLabel = "Saved 💾";

    setTimeout(() => {
      saveLabel = "Save settings";
    }, 2000);
  }

  function resetSettings() {
    settings = { ...defaultSettings };

    lightsatsComponent.onSaveSettings();
    nostrComponent.onSaveSettings();
    debugComponent.onSaveSettings();
  }

  function undoSettings() {
    settings = JSON.parse(lastSavedSettings);
  }

  function setActiveSection(section, icon) {
    const sections = document.querySelectorAll("main section");
    const icons = document.querySelectorAll(".sidebar .icon");

    sections.forEach((s) => s.classList.remove("active"));
    icons.forEach((i) => i.classList.remove("active"));

    document.getElementById(section + "-section").classList.add("active");
    icon.classList.add("active");
  }
</script>

<div class="container">
  <nav class="sidebar">
    <button
      class="icon active"
      on:click={(event) => setActiveSection("settings", event.currentTarget)}
      data-tooltip="Settings"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
      >
        <path fill="none" d="M0 0h24v24H0z" />
        <path
          d="M12 1l9.5 5.5v11L12 23l-9.5-5.5v-11L12 1zm0 2.311L4.5 7.653v8.694L12 20.689l7.5-4.342V7.653L12 3.311zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
        />
      </svg>
    </button>
    <button
      class="icon"
      on:click={(event) => setActiveSection("tools", event.currentTarget)}
      data-tooltip="Tools"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
      >
        <path fill="none" d="M0 0h24v24H0z" />
        <path
          d="M5.33 3.271a3.5 3.5 0 0 1 4.472 4.474L20.647 18.59l-2.122 2.121L7.68 9.867a3.5 3.5 0 0 1-4.472-4.474L5.444 7.63a1.5 1.5 0 1 0 2.121-2.121L5.329 3.27zm10.367 1.884l3.182-1.768 1.414 1.414-1.768 3.182-1.768.354-2.12 2.121-1.415-1.414 2.121-2.121.354-1.768zm-7.071 7.778l2.121 2.122-4.95 4.95A1.5 1.5 0 0 1 3.58 17.99l.097-.107 4.95-4.95z"
        />
      </svg>
    </button>
  </nav>

  <main class="content">
    <section id="settings-section" class="active">
      <div
        class="section collapsable"
        id="nostr-settings"
        class:dirty={isDirtyNostr}
      >
        <h2 class:dirty={isDirtyNostr}>Nostr Settings</h2>

        <div class="input-container collapsed">
          <NostrSettings
            nostrSettings={settings.nostrSettings}
            bind:this={nostrComponent}
            bind:isDirty={isDirtyNostr}
          />
        </div>
      </div>
      <div
        class="section collapsable"
        id="lightsats-settings"
        class:dirty={isDirtyLightsats}
      >
        <h2 class:dirty={isDirtyLightsats}>Lightsats Integration</h2>

        <div class="input-container collapsed">
          <LightsatsSettings
            lightsatsSettings={settings.lightsatsSettings}
            bind:this={lightsatsComponent}
            bind:isDirty={isDirtyLightsats}
          />
        </div>
      </div>
      <div
        class="section collapsable"
        id="debug-settings"
        class:dirty={isDirtyDebug}
      >
        <h2 class:dirty={isDirtyDebug}>Debug Settings</h2>

        <div class="input-container collapsed">
          <DebugSettings
            debugSettings={settings.debug}
            bind:this={debugComponent}
            bind:isDirty={isDirtyDebug}
          />
        </div>
      </div>
    </section>
    <section id="tools-section">
      <div
        class="section collapsable"
        class:dirty={isDirtyNIP65}
        id="nip65-settings"
      >
        <h2>NIP-65 Relay Manager</h2>
        <div class="input-container expanded">
          {#if settings.nostrSettings.mode === "nostrconnect" || settings.nostrSettings.mode === "bunker"}
            <NIP65RelayManager bind:isDirty={isDirtyNIP65} {settings} />
          {:else if settings.nostrSettings.mode === "anon"}
            <fieldset>
              <legend>Anonymous mode</legend>
              <p>NIP-65 is disabled in anonymous mode.</p>
            </fieldset>
          {:else if settings.nostrSettings.mode === "nip07"}
            <fieldset>
              <legend>NIP-07 mode</legend>
              <a
                href="https://nostrize.me/pages/nip65-manager.html"
                target="_blank"
                class="simple-tooltip"
                data-tooltip-text="You can't directly manage NIP-65 relays in Nostrize 
                when you're in NIP-07 mode. Click here to manage them in https://nostrize.me"
              >
                Open link to manage NIP-65 relays
              </a>
            </fieldset>
          {:else}
            <fieldset>
              <legend>{settings.nostrSettings.mode}</legend>
              <p>Not Implemented for your Nostr mode</p>
            </fieldset>
          {/if}
        </div>
      </div>
    </section>
    <div id="misc-container">
      <button
        id="undo-settings"
        on:click={undoSettings}
        class:dirty={isDirty}
        disabled={!isDirty}
      >
        Undo Changes
      </button>

      <button
        id="reset-settings"
        on:click={resetSettings}
        class:dirty={!isDefaultSettings}
        disabled={isDefaultSettings}
      >
        Reset Factory Settings</button
      >
      <button
        id="save-settings"
        on:click={saveSettings}
        class:dirty={isDirty}
        disabled={!isDirty}
      >
        {saveLabel}
      </button>
    </div>
  </main>
</div>

<div class="version-container">
  <div class="version">
    Settings Version: <span id="version-number">{settings.version}</span>
  </div>
</div>

<style>
  h2 {
    color: black;
    margin-top: 5px;
    margin-bottom: 5px;
    cursor: pointer;
  }

  .section {
    background-color: rgba(130, 80, 223, 0.1);
    padding: 10px;
    margin-bottom: 20px;
    min-width: 400px;
    max-width: 400px;
    width: 100%; /* Make sure it doesn't exceed max-width */
    box-sizing: border-box; /* Include padding in width calculation */
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  .section.dirty {
    position: relative;
    background-color: rgba(223, 80, 147, 0.1);
  }

  .input-container {
    display: flex;
    margin-top: 10px;
    flex-direction: column;
  }

  .input-container.collapsed {
    display: none;
  }

  .section h2 {
    margin: 0;
    padding: 10px 10px 10px 40px;
    position: relative;
  }

  .section h2::before {
    content: "▶"; /* The default arrow indicator */
    position: absolute;
    left: 10px; /* Adjust this value to position the indicator inside the section */
    transition: transform 0.3s ease-out;
  }

  .section h2.dirty::before {
    content: "▶"; /* The default arrow indicator */
    color: red;
    position: absolute;
    left: 10px; /* Adjust this value to position the indicator inside the section */
    transition: transform 0.3s ease-out;
  }

  .section:has(.input-container.collapsed) h2::before {
    transform: rotate(0deg); /* Indicator points right when collapsed */
  }

  .section:has(.input-container.expanded) h2::before {
    transform: rotate(90deg); /* Indicator points down when expanded */
  }

  button {
    background-color: rgba(130 80 223 / 75%);
    color: floralwhite;
    padding: 5px;
    cursor: pointer;
    font-weight: bold;
    width: fit-content;
  }

  .version-container {
    display: flex;
    flex: 1 1 auto;
    width: 100%;
    align-items: flex-end;
    padding-top: 20px;
  }

  .container {
    display: flex;
    width: 100%;
    min-height: fit-content;
  }

  .sidebar {
    width: 60px;
    background-color: #f0f0f0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 20px;
  }

  .icon {
    width: 40px;
    height: 40px;
    margin-bottom: 20px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 0;
    border-radius: 50%;
    transition: background-color 0.3s;
    background-color: rgba(130, 80, 223, 0.1);
    position: relative;
  }

  .icon:hover {
    background-color: rgba(130, 80, 223, 0.4);
  }

  .icon.active {
    background-color: rgba(130, 80, 223, 0.4);
  }

  .icon svg {
    width: 24px;
    height: 24px;
  }

  .icon::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    transform: translateY(-5px);
    background-color: black;
    color: white;
    border-radius: 5px;
    padding: 5px 10px;
    font-size: 0.8em;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
  }

  .icon:hover::after {
    opacity: 1;
    visibility: visible;
  }

  .content {
    flex-grow: 1;
    padding: 20px;
  }

  section {
    display: none;
  }

  section.active {
    display: block;
  }

  #misc-container {
    display: flex;
    gap: 10px;
    width: 100%;
    justify-content: center;
    max-width: 400px;
  }

  #misc-container button {
    width: 106px;
  }

  #reset-settings {
    background-color: rgba(139, 0, 0, 0.75);
  }

  #reset-settings:hover {
    background-color: rgba(139, 0, 0, 1);
  }

  #save-settings {
    background-color: rgba(0, 128, 0, 0.75);
  }

  #save-settings:hover {
    background-color: rgba(0, 128, 0, 1);
  }

  #undo-settings:hover {
    background-color: rgba(130, 80, 223, 1);
  }

  #misc-container button.dirty {
    opacity: 1;
  }

  #misc-container button:not(.dirty) {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
