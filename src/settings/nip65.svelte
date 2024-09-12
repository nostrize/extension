<script>
  import { onMount } from 'svelte';
  import { getPageUserRelays } from '../helpers/relays';

  export let pubkey;
  export let relays;

  let nip65Relays = [];
  let isLoading = true;

  onMount(async () => {
    try {
      const { tags } = await getPageUserRelays({ pubkey, relays });
      
      nip65Relays = tags
        .filter(tag => tag[0] === 'r')
        .map(tag => ({ 
          relay: tag[1], 
          read: !tag[2] || tag[2] === 'read', 
          write: !tag[2] || tag[2] === 'write' 
        }));

      console.log(nip65Relays);
    } catch (error) {
      console.error('Error fetching NIP-65 relays:', error);
    } finally {
      isLoading = false;
    }
  });

  function addRelay() {
    nip65Relays = [...nip65Relays, { relay: '', read: true, write: true }];
  }

  function removeRelay(index) {
    nip65Relays = nip65Relays.filter((_, i) => i !== index);
  }

  function updateRelay(index, url, isRead, isWrite) {
    nip65Relays = nip65Relays.map((relay, i) => 
      i === index ? { ...relay, relay: url, read: isRead, write: isWrite } : relay
    );
  }

  async function publishNIP65Event() {
    // Implement NIP-65 event publishing logic
  }
</script>

<div class="nip65-relay-manager">
  {#if isLoading}
    <p>Loading NIP-65 relays...</p>
  {:else}
    {#each nip65Relays as relay, index}
      <div class="relay-row">
        <input type="text" value={relay.relay} on:change={(e) => updateRelay(index, e.target.value, relay.read, relay.write)}>
        <label>
          <input type="checkbox" checked={relay.read} on:change={(e) => updateRelay(index, relay.relay, e.target.checked, relay.write)}>
          Read
        </label>
        <label>
          <input type="checkbox" checked={relay.write} on:change={(e) => updateRelay(index, relay.relay, relay.read, e.target.checked)}>
          Write
        </label>
        <button on:click={() => removeRelay(index)}>Remove</button>
      </div>
    {/each}
    <div class="button-container">
      <button on:click={addRelay}>Add Relay</button>
      <button on:click={publishNIP65Event}>Publish NIP-65 Event</button>
    </div>
  {/if}
</div>

<style>
  .relay-row {
    display: flex;
    align-items: center;
    margin-bottom: 3px;
  }
  input[type="text"] {
    width: 150px;
    margin-right: 3px;
  }
  label {
    margin-right: 3px;
    display: flex;
    align-items: center;
  }
  button {
    margin-left: 3px;
  }
  .button-container {
    display: flex;
    justify-content: flex-start;
    margin-top: 15px;
  }
</style>