<script lang="ts">
  import type { NostrizeSettings } from "../helpers/accounts.types";

  import CustomCheckbox from "../components/checkbox/custom-checkbox.svelte";

  import "./common.css";
  import Tooltip from "../components/tooltip/tooltip.svelte";

  export let nostrizeSettings: NostrizeSettings;
  export let isDirty = false;

  let nostrizeSettingsHash = JSON.stringify(nostrizeSettings);

  $: isDirty = JSON.stringify(nostrizeSettings) !== nostrizeSettingsHash;

  export function rehashSettings() {
    nostrizeSettingsHash = JSON.stringify(nostrizeSettings);
  }
</script>

<div class="nostrize-settings">
  <fieldset>
    <legend>Open This Page (Settings)</legend>
    <CustomCheckbox
      id="alwaysOpenInNewTab"
      text="Always In A New Tab"
      bind:checked={nostrizeSettings.alwaysOpenInNewTab}
    />
  </fieldset>

  <fieldset id="debug-settings-logging">
    <legend>Logging</legend>
    <CustomCheckbox
      id="log"
      text="Enable Logging"
      bind:checked={nostrizeSettings.debug.enableLogging}
    />

    <div>
      <Tooltip
        text="This helps in identifying Nostrize logs."
        title="Namespace"
      />

      <input
        type="text"
        id="namespace"
        placeholder="Namespace"
        bind:value={nostrizeSettings.debug.namespace}
      />
    </div>
  </fieldset>
</div>
