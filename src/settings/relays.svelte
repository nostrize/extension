<script>
  import CustomCheckbox from "../components/checkbox/custom-checkbox.svelte";
  import Tooltip from "../components/tooltip/tooltip.svelte";

  export let relaysSettings;
  export let mode;

  function addRelay() {
    relaysSettings.local.relays = [
      ...relaysSettings.local.relays,
      { relay: "", enabled: false, read: false, write: false },
    ];
  }

  function removeRelay(index) {
    relaysSettings.local.relays = relaysSettings.local.relays.filter(
      (_, i) => i !== index,
    );
  }
</script>

<div class="bold">Local Relays</div>

<div>
  <div style="display: flex; align-items: center;">
    <CustomCheckbox
      bind:checked={relaysSettings.local.useRelays}
      text="Use Relays"
    />

    <Tooltip
      text="Local relays are helpful when you are in anonymous mode or when you are changing your nostr mode. Keep them enabled and they will be used on every nostr mode."
    />
  </div>

  <div class="relay-grid">
    {#each relaysSettings.local.relays as relay, index}
      <input type="text" bind:value={relay.relay} />
      <CustomCheckbox
        bind:checked={relay.enabled}
        tooltip="Enable this relay"
      />
      <CustomCheckbox bind:checked={relay.read} tooltip="Enable read" />
      <CustomCheckbox bind:checked={relay.write} tooltip="Enable write" />
      <button class="settings-button" on:click={() => removeRelay(index)}>
        Remove
      </button>
    {/each}
  </div>
  <button class="settings-button add-relay" on:click={addRelay}>
    Add Relay
  </button>
</div>

{#if mode === "nip07"}
  <div class="bold margin10">NIP-07 Relays</div>
  <CustomCheckbox
    text="Use Relays from NIP-07 extension"
    bind:checked={relaysSettings.nip07.useRelays}
  />
  <a
    href="https://nostrize.me/pages/nip07-manager.html"
    target="_blank"
    class="simple-tooltip"
    data-tooltip-text="Click to add NIP-07 Relays to Local Relays if you want to use them as fallback relays."
  >
    Add NIP-07 Relays to Local Relays
  </a>
{/if}

<style>
  .relay-grid {
    display: grid;
    grid-template-columns: 7fr 1fr 1fr 1fr 1fr;
    gap: 2px;
    margin-top: 10px;
    align-items: center;
  }

  .relay-grid input[type="text"] {
    width: 100%;
    box-sizing: border-box;
  }

  .add-relay {
    margin-top: 10px;
  }

  .bold {
    font-weight: bold;
  }

  .margin10 {
    margin-top: 10px;
  }
</style>
