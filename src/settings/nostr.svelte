<script>
  import CustomCheckbox from "../components/checkbox/custom-checkbox.svelte";

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
    <label for="mode"
      >Mode
      <span class="help-icon">❓</span>
      <span class="tooltip"
        >Choose the mode for Nostr. 'Anonymous' generates new keys everytime for
        event signing, while 'NIP-07' gets your nostr public key and signs
        events using browser extensions like alby or nos2x. Use NostrConnect to
        select providers</span
      >
    </label>
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
    <label for="open-nostr"
      >URL
      <span class="help-icon">❓</span>
      <span class="tooltip">You can specify a URL to open nostr links in.</span>
    </label>
    <input type="text" id="open-nostr" bind:value={nostrSettings.openNostr} />
  </fieldset>

  <fieldset>
    <legend>Relays</legend>
    <ul id="relays-list" style="list-style-type: none; padding-left: 0">
      {#each nostrSettings.relays as relay}
        <li class="relay-item">
          <input type="text" bind:value={relay} />
          <button on:click={() => removeRelay(relay)}>Remove</button>
        </li>
      {/each}
    </ul>
    <button id="add-relay" on:click={addRelay}>Add Relay</button>
  </fieldset>
</div>
