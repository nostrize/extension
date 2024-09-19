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
        >Create your first tip</a
      >
    </Tooltip>
  </fieldset>

  <fieldset>
    <legend>API Key</legend>

    <Tooltip text="Enter your Lightsats API key here." title="API Key" />

    <input
      type="password"
      id="lightsats-api-key"
      placeholder="API Key"
      bind:value={lightsatsSettings.apiKey}
    />
  </fieldset>

  <fieldset id="lightsats-integration">
    <legend>Integration</legend>

    <div style="display: flex; align-items: center;">
      <CustomCheckbox
        id="lightsats-enable"
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
