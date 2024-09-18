<script>
  import CustomCheckbox from "../components/checkbox/custom-checkbox.svelte";

  export let debugSettings;
</script>

<div class="debug-settings">
  <fieldset id="debug-settings-logging">
    <legend>Logging</legend>
    <CustomCheckbox
      id="log"
      text="Enable Logging"
      bind:checked={debugSettings.log}
    />
  </fieldset>

  <fieldset>
    <legend>Namespace</legend>
    <label for="namespace"
      >Namespace
      <span class="help-icon">❓</span>
      <span class="tooltip">This helps in identifying Nostrize logs.</span>
    </label>
    <input
      type="text"
      id="namespace"
      placeholder="Namespace"
      bind:value={debugSettings.namespace}
    />
  </fieldset>
</div>

<style>
  #namespace {
    max-width: 96%;
  }
</style>
