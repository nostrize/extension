<script>
  import CustomCheckbox from "../components/checkbox/custom-checkbox.svelte";
  import Tooltip from "../components/tooltip/tooltip.svelte";

  export let lightsatsSettings;
</script>

<div class="lightsats-settings">
  <fieldset>
    <legend>Registration</legend>
    <Tooltip text="This link is for registering a new account on Lightsats.">
      <a href="https://lightsats.com" target="_blank" slot="slotTitle"
        >Create lightsats account</a
      >
    </Tooltip>
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
