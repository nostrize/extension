<script>
  import CustomCheckbox from "../components/checkbox/custom-checkbox.svelte";

  export let lightsatsSettings;
</script>

<div class="lightsats-settings">
  <fieldset>
    <legend>Registration</legend>
    <label for="lightsats-registration">
      <a href="https://lightsats.com" target="_blank">Create your first tip</a>
      <span class="help-icon">❓</span>
      <span class="tooltip"
        >This link is for registering a new account on Lightsats.</span
      >
    </label>
  </fieldset>

  <fieldset>
    <legend>API Key</legend>
    <label for="lightsats-api-key"
      >API Key
      <span class="help-icon">❓</span>
      <span class="tooltip">Enter your Lightsats API key here.</span>
    </label>
    <input
      type="password"
      id="lightsats-api-key"
      placeholder="API Key"
      bind:value={lightsatsSettings.apiKey}
    />
  </fieldset>

  <fieldset id="lightsats-integration">
    <legend>Integration</legend>
    <CustomCheckbox
      id="lightsats-enable"
      bind:checked={lightsatsSettings.enabled}
      text="Enable Lightsats Integration"
      tooltip="When enabled, Nostrize extension will show a Lightsats button if the
        user has no Nostr integration."
    />
  </fieldset>
</div>
