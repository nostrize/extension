<script>
  import CustomCheckbox from "../components/checkbox/custom-checkbox.svelte";
  import Tooltip from "../components/tooltip/tooltip.svelte";

  import "./common.css";

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
    <Tooltip
      text="This helps in identifying Nostrize logs."
      title="Namespace"
    />

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
