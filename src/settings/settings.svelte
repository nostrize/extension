<script lang="ts">
  import { defaultSettings } from "../helpers/accounts";
  import type { NostrizeAccount } from "../helpers/accounts.types";

  import SectionItem from "./section-item.svelte";
  import NostrSettings from "./nostr.svelte";
  import LightsatsSettings from "./lightsats.svelte";
  import DebugSettings from "./debug.svelte";
  import NIP65RelayManager from "./nip65.svelte";
  import Leftbar from "./leftbar.svelte";
  import SaveResetButtons from "./save-reset-buttons.svelte";

  const nostrModeOptions = {
    anon: {
      label: "Anonymous",
      description: "Generates new keys each time you need to sign an event.",
    },
    nip07: {
      label: "NIP-07",
      description:
        "Signs events and gets your nostr relays and public key using browser extensions like alby or nos2x.",
    },
    nostrconnect: {
      label: "NostrConnect",
      description: "Connect to remote signing providers or create new account.",
    },
    bunker: {
      label: "Bunker",
      description: "Copy a Bunker URL from a remote signing provider.",
    },
  };

  export let currentAccount: NostrizeAccount;
  export let accounts: NostrizeAccount[];

  export let handleAccountChange;
  export let handleLogout;
  export let editingAccount: NostrizeAccount | null;

  $: settings = currentAccount.settings;
  $: nostrModeLabel = nostrModeOptions[settings.nostrSettings.mode].label;

  let lightsatsComponent: LightsatsSettings;
  let nostrComponent: NostrSettings;
  let debugComponent: DebugSettings;

  let isDirtyLightsats = false;
  let isDirtyNostr = false;
  let isDirtyDebug = false;
  let isDirtyNIP65 = false;
  $: isDirty = isDirtyLightsats || isDirtyNostr || isDirtyDebug;

  let lastSavedSettings = JSON.stringify(currentAccount.settings);

  function handleSave() {
    lastSavedSettings = JSON.stringify(currentAccount.settings);
    lightsatsComponent.onSaveSettings();
    nostrComponent.onSaveSettings();
    debugComponent.onSaveSettings();
  }

  function handleReset() {
    settings = { ...defaultSettings };
    lightsatsComponent.onSaveSettings();
    nostrComponent.onSaveSettings();
    debugComponent.onSaveSettings();
  }

  function handleUndo() {
    settings = JSON.parse(lastSavedSettings);
  }

  let showSaveResetButtons = true;

  function setActiveSection(section: string, icon: HTMLElement) {
    const sections = document.querySelectorAll("main section");
    const icons = document.querySelectorAll(".sidebar .icon");

    sections.forEach((s) => s.classList.remove("active"));
    icons.forEach((i) => i.classList.remove("active"));

    const s = document.getElementById(section + "-section");

    if (!s) {
      throw new Error("Section not found");
    }

    s.classList.add("active");
    icon.classList.add("active");

    if (section === "tools") {
      showSaveResetButtons = false;
    } else {
      showSaveResetButtons = true;
    }
  }

  function toggleCollapsible(event: MouseEvent) {
    const header = event.currentTarget as HTMLElement;
    const section = header.closest(".section.collapsable");
    if (section) {
      header.classList.toggle("collapsed");
      header.classList.toggle("expanded");

      const inputContainer = section.querySelector(".input-container");
      if (inputContainer) {
        inputContainer.classList.toggle("collapsed");
        inputContainer.classList.toggle("expanded");
      }
    }
  }
</script>

<div class="settings-container">
  <div class="content-wrapper">
    <Leftbar
      {setActiveSection}
      {currentAccount}
      {accounts}
      {handleAccountChange}
      {handleLogout}
      bind:editingAccount
    />

    <main class="content">
      <section id="settings-section" class="active">
        <SectionItem
          title="Nostr Settings"
          isDirty={isDirtyNostr}
          {toggleCollapsible}
        >
          <NostrSettings
            slot="content"
            bind:nostrSettings={settings.nostrSettings}
            {nostrModeOptions}
            bind:this={nostrComponent}
            bind:isDirty={isDirtyNostr}
          />
        </SectionItem>

        <SectionItem
          title="Lightsats Integration"
          isDirty={isDirtyLightsats}
          {toggleCollapsible}
        >
          <LightsatsSettings
            slot="content"
            bind:lightsatsSettings={settings.lightsatsSettings}
            bind:isDirty={isDirtyLightsats}
          />
        </SectionItem>

        <SectionItem
          title="Debug Settings"
          isDirty={isDirtyDebug}
          {toggleCollapsible}
        >
          <DebugSettings
            slot="content"
            debugSettings={settings.debug}
            bind:this={debugComponent}
            bind:isDirty={isDirtyDebug}
          />
        </SectionItem>
      </section>
      <section id="tools-section">
        <SectionItem
          title="NIP-65 Relay Manager"
          isDirty={isDirtyNIP65}
          {toggleCollapsible}
        >
          <div slot="content">
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
        </SectionItem>
      </section>

      {#if showSaveResetButtons}
        <SaveResetButtons
          {currentAccount}
          {isDirty}
          onSave={handleSave}
          onReset={handleReset}
          onUndo={handleUndo}
        />
      {/if}
    </main>
  </div>
</div>

<div class="footer-info">
  <div class="version-container">
    Settings Version: <span id="version-number">{settings.version}</span>
  </div>

  <div class="nostr-mode-container">
    Nostr Mode:
    <span id="nostr-mode">
      {nostrModeLabel}
    </span>
  </div>
</div>

<style>
  section {
    display: none;
  }

  section.active {
    display: block;
  }

  .settings-container {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 70vh;
  }

  .footer-info {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 10px;
    margin-top: 50px;
  }

  .version-container,
  .nostr-mode-container {
    flex: 1;
  }

  .content-wrapper {
    display: flex;
    flex: 1 0 auto;
    justify-content: center;
    width: 100%;
  }

  .version-container {
    flex-shrink: 0;
    margin-top: 20px;
  }
</style>
