<script>
  import CustomCheckbox from "../components/checkbox/custom-checkbox.svelte";
  import Tooltip from "../components/tooltip/tooltip.svelte";

  export let nostrSettings;

  function addRelay() {
    nostrSettings.relays = [...nostrSettings.relays, ""];
  }

  function removeRelay(relay) {
    nostrSettings.relays = nostrSettings.relays.filter((r) => r !== relay);
  }
</script>

<div class="nostr-settings">
  <fieldset>
    <legend>Mode</legend>

    <Tooltip
      text="Choose the mode for Nostr. 'Anonymous' generates new keys everytime for
        event signing, while 'NIP-07' gets your nostr public key and signs
        events using browser extensions like alby or nos2x. Use NostrConnect to
        select providers"
      title="Mode"
    />

    <select id="mode" bind:value={nostrSettings.mode}>
      <option value="anon">Anonymous</option>
      <option value="nip07">NIP07</option>
      <option value="nostrconnect">NostrConnect</option>
    </select>
  </fieldset>

  {#if nostrSettings.mode === "nip07"}
    <fieldset>
      <legend>NIP07 Settings</legend>
      <CustomCheckbox
        text="Use Relays from NIP07 extension"
        bind:checked={nostrSettings.nip07.useRelays}
      />
    </fieldset>
  {/if}

  <fieldset>
    <legend>Open Nostr Links</legend>

    <Tooltip text="You can specify a URL to open nostr links" title="URL" />

    <input type="text" id="open-nostr" bind:value={nostrSettings.openNostr} />
  </fieldset>

  <fieldset>
    <legend>Relays</legend>
    <ul id="relays-list" style="list-style-type: none; padding-left: 0">
      {#each nostrSettings.relays as relay}
        <li class="relay-item">
          <input type="text" bind:value={relay} />
          <button
            class="remove-relay-button settings-button"
            on:click={() => removeRelay(relay)}
          >
            Remove
          </button>
        </li>
      {/each}
    </ul>
    <button class="settings-button" on:click={addRelay}>Add Relay</button>
  </fieldset>
</div>

<style>
  .relay-item {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .relay-item input[type="text"] {
    flex-grow: 1;
    min-width: 0;
    margin-bottom: 4px;
  }

  .relay-item .remove-relay-button {
    flex-shrink: 0;
  }
</style>
