<script>
  import CustomCheckbox from "../components/checkbox/custom-checkbox.svelte";

  import "./common.css";

  export let nostrizeSettings;
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
</div>
