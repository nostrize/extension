<script lang="ts">
  import { defaultSettings, saveNostrizeSettings } from "../helpers/accounts";
  import type { NostrizeAccount } from "../helpers/accounts.types";

  import "./common.css";

  export let currentAccount: NostrizeAccount;
  export let isDirty: boolean;
  export let onSave: () => void;
  export let onReset: () => void;
  export let onUndo: () => void;

  let saveLabel = "Save settings";

  $: isDefaultSettings =
    currentAccount.settings &&
    JSON.stringify(currentAccount.settings) === JSON.stringify(defaultSettings);

  async function saveSettings() {
    await saveNostrizeSettings(currentAccount.settings);

    onSave();
    saveLabel = "Saved 💾";
    setTimeout(() => {
      saveLabel = "Save settings";
    }, 2000);
  }
</script>

<div id="misc-container">
  <button
    id="undo-settings"
    class="settings-button"
    on:click={onUndo}
    class:dirty={isDirty}
    disabled={!isDirty}
  >
    Undo Changes
  </button>

  <button
    id="reset-settings"
    class="settings-button"
    on:click={onReset}
    class:dirty={!isDefaultSettings}
    disabled={isDefaultSettings}
  >
    Reset Factory Settings
  </button>

  <button
    id="save-settings"
    class="settings-button"
    on:click={saveSettings}
    class:dirty={isDirty}
    disabled={!isDirty}
  >
    {saveLabel}
  </button>
</div>

<style>
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
