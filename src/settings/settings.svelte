<script lang="ts">
  import type {
    NostrizeAccount,
    NostrMode,
    NostrModeOption,
  } from "../helpers/accounts.types";
  import { defaultSettings } from "../helpers/accounts";

  import SectionItem from "./section-item.svelte";
  import NostrSettings from "./nostr.svelte";
  import LightsatsSettings from "./lightsats.svelte";
  import NIP65RelayManager from "./nip65.svelte";
  import Leftbar from "./leftbar.svelte";
  import SaveResetButtons from "./save-reset-buttons.svelte";
  import NostrizeSettings from "./nostrize-settings.svelte";

  export let currentAccount: NostrizeAccount;
  export let accounts: NostrizeAccount[];

  export let handleAccountChange: (account: NostrizeAccount) => void;
  export let handleLogout;
  export let editingAccount: NostrizeAccount | null;
  export let getNostrModeLabel: (mode: NostrMode) => string;
  export let nostrModeOptions: Record<NostrMode, NostrModeOption>;

  $: settings = currentAccount.settings;

  let lightsatsComponent: LightsatsSettings;
  let nostrComponent: NostrSettings;
  let nostrizeComponent: NostrizeSettings;

  let isDirtyLightsats = false;
  let isDirtyNostr = false;
  let isDirtyNostrize = false;

  $: isDirty = isDirtyLightsats || isDirtyNostr || isDirtyNostrize;

  let isDirtyNIP65 = false;

  let lastSavedSettings = JSON.stringify(currentAccount.settings);

  const handleUnsavedChanges = (callback?: () => void) => (e: MouseEvent) => {
    if (!isDirty) {
      return callback?.();
    }

    if (
      !confirm(
        "Are you sure you want to leave the settings? You will lose your unsaved changes",
      )
    ) {
      e.preventDefault();
    } else {
      handleUndo();

      callback?.();
    }
  };

  function handleSave() {
    lastSavedSettings = JSON.stringify(currentAccount.settings);

    rehashAll();
  }

  function handleReset() {
    settings = { ...defaultSettings };

    rehashAll();
  }

  function handleUndo() {
    currentAccount.settings = JSON.parse(lastSavedSettings);
  }

  async function changeAccount(account: NostrizeAccount) {
    await handleAccountChange(account);

    lastSavedSettings = JSON.stringify(currentAccount.settings);

    rehashAll();
  }

  function rehashAll() {
    nostrComponent.rehashSettings();
    lightsatsComponent.rehashSettings();
    nostrizeComponent.rehashSettings();
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
</script>

<div class="settings-container">
  <div class="content-wrapper">
    <Leftbar
      {setActiveSection}
      {currentAccount}
      {accounts}
      {changeAccount}
      {handleLogout}
      {handleUnsavedChanges}
      bind:editingAccount
    />

    <main class="content">
      <section id="settings-section" class="active">
        <SectionItem title="Nostr Settings" isDirty={isDirtyNostr}>
          <NostrSettings
            slot="content"
            bind:nostrSettings={settings.nostrSettings}
            bind:this={nostrComponent}
            bind:isDirty={isDirtyNostr}
            {nostrModeOptions}
          />
        </SectionItem>

        <SectionItem title="Lightsats Integration" isDirty={isDirtyLightsats}>
          <LightsatsSettings
            slot="content"
            bind:this={lightsatsComponent}
            bind:lightsatsSettings={settings.lightsatsSettings}
            bind:isDirty={isDirtyLightsats}
          />
        </SectionItem>

        <SectionItem title="Nostrize Settings" isDirty={isDirtyNostrize}>
          <NostrizeSettings
            slot="content"
            bind:this={nostrizeComponent}
            bind:isDirty={isDirtyNostrize}
            bind:nostrizeSettings={settings.nostrizeSettings}
          />
        </SectionItem>
      </section>
      <section id="tools-section">
        <SectionItem title="NIP-65 Relay Manager" isDirty={isDirtyNIP65}>
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
      {getNostrModeLabel(settings.nostrSettings.mode)}
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
