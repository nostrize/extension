<script>
  import CustomCheckbox from "../components/checkbox/custom-checkbox.svelte";
  import Tooltip from "../components/tooltip/tooltip.svelte";

  export let lightsatsSettings;
  export let isDirty = false;

  let lightsatsSettingsHash = JSON.stringify(lightsatsSettings);

  $: isDirty = JSON.stringify(lightsatsSettings) !== lightsatsSettingsHash;

  export function rehashSettings() {
    lightsatsSettingsHash = JSON.stringify(lightsatsSettings);
  }
</script>

<div class="lightsats-settings">
  <fieldset>
    <legend>Registration</legend>
    <a
      href="https://lightsats.com"
      target="_blank"
      class="simple-tooltip"
      data-tooltip-text="Click to learn more about Lightsats, also create an account if you don't have one yet."
      >What is Lightsats?</a
    >
  </fieldset>

  <fieldset>
    <legend>API Key</legend>

    <div>
      <Tooltip
        text="Enter your Lightsats API key here. You can copy your 'Developer API Keys' in your profile page, in the 'Connected accounts & more' section."
        title="API Key"
      />

      <input
        type="password"
        id="lightsats-api-key"
        placeholder="API Key"
        bind:value={lightsatsSettings.apiKey}
      />
    </div>
  </fieldset>

  <fieldset id="lightsats-integration">
    <legend>Integration</legend>

    <div style="display: flex; align-items: center;">
      <CustomCheckbox
        bind:checked={lightsatsSettings.enabled}
        text="Enable Lightsats Integration"
      />

      <Tooltip
        text="When enabled, Nostrize extension will show a Lightsats button if the
        user has no Nostr integration."
      />
    </div>
  </fieldset>
</div>
