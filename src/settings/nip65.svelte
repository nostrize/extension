<script>
  import { SimplePool } from "nostr-tools";

  import { getNip65Relays } from "../helpers/nip65.js";
  import { signEvent } from "../helpers/signer.js";
  import { getNostrizeUserRelays } from "../helpers/relays.js";

  import "../settings/common.css";
  import { getNostrizeUserPubkey } from "../helpers/nostr.js";
  import Loading from "../components/loading.svelte";

  export let settings;

  let nostrizeUserPubkey;
  let nostrizeUserRelays;
  let nip65Relays = [];
  let isLoading = false;
  let error = "";
  let success = "";

  loadNip65Relays();

  function addRelay() {
    nip65Relays = [...nip65Relays, { relay: "", read: true, write: true }];
  }

  function removeRelay(index) {
    nip65Relays = nip65Relays.filter((_, i) => i !== index);
  }

  function updateRelay(index, url, isRead, isWrite) {
    nip65Relays = nip65Relays.map((relay, i) =>
      i === index
        ? { ...relay, relay: url, read: isRead, write: isWrite }
        : relay,
    );
  }

  async function loadNip65Relays() {
    isLoading = true;

    try {
      nostrizeUserPubkey = await getNostrizeUserPubkey({
        mode: settings.nostrSettings.mode,
        nostrConnectSettings: settings.nostrSettings.nostrConnect,
      });
    } catch (e) {
      error = "Failed to load user pubkey: " + e.message;
    } finally {
      isLoading = false;
    }

    try {
      nostrizeUserRelays = await getNostrizeUserRelays({
        settings,
        pubkey: nostrizeUserPubkey,
      });
    } catch (e) {
      error = "Failed to load user relays: " + e.message;
    } finally {
      isLoading = false;
    }

    try {
      const response = await getNip65Relays({
        pubkey: nostrizeUserPubkey,
        relays: nostrizeUserRelays.writeRelays,
        updatedCallback: (response) => {
          isLoading = false;

          nip65Relays = response.flatRelays;
        },
      });

      nip65Relays = response.flatRelays;
    } catch (e) {
      error = "Failed to load NIP-65 relays: " + e.message;
    }
  }

  async function publishNIP65Event() {
    if (!nostrizeUserPubkey) {
      error = "Failed to load user pubkey";

      return;
    }

    const relayListEvent = {
      pubkey: nostrizeUserPubkey,
      kind: 10002,
      tags: nip65Relays
        .filter((r) => r.read || r.write)
        .map((r) => {
          if (r.read && !r.write) {
            return ["r", r.relay, "read"];
          }

          if (!r.read && r.write) {
            return ["r", r.relay, "write"];
          }

          return ["r", r.relay];
        }),
      created_at: Math.floor(Date.now() / 1000),
      content: "",
    };

    const signedEvent = await signEvent({
      mode: settings.nostrSettings.mode,
      eventTemplate: relayListEvent,
      nostrConnectSettings: settings.nostrSettings.nostrConnect,
    });

    const pool = new SimplePool();
    const res = await Promise.allSettled(
      pool.publish(nostrizeUserRelays.writeRelays, signedEvent),
    );

    const publishedCount = res.filter((r) => r.status === "fulfilled").length;
    const failedRelays = res.filter((r) => r.status === "rejected");

    if (publishedCount === 0) {
      error =
        "Failed to publish NIP-65 event: " +
        failedRelays.map((r) => r.reason).join(", ");
      success = "";
    } else {
      error = "";
      success = "NIP-65 event published successfully";

      setTimeout(() => {
        success = "";
      }, 5000);
    }
  }
</script>

<div class="nip65-relay-manager">
  {#if isLoading}
    <Loading />
  {/if}

  {#if nip65Relays.length > 0}
    <div class="relay-list">
      {#each nip65Relays as relay, index}
        <div class="relay-row">
          <input
            type="text"
            value={relay.relay}
            on:change={(e) =>
              updateRelay(index, e.target.value, relay.read, relay.write)}
          />
          <label>
            <input
              type="checkbox"
              checked={relay.read}
              on:change={(e) =>
                updateRelay(index, relay.relay, e.target.checked, relay.write)}
            />
            Read
          </label>
          <label>
            <input
              type="checkbox"
              checked={relay.write}
              on:change={(e) =>
                updateRelay(index, relay.relay, relay.read, e.target.checked)}
            />
            Write
          </label>
          <button class="settings-button" on:click={() => removeRelay(index)}>
            Remove
          </button>
        </div>
      {/each}
    </div>
  {/if}

  <div class="button-container">
    <button class="settings-button" on:click={addRelay}>Add Relay</button>
    <button class="settings-button" on:click={publishNIP65Event}>
      Publish NIP-65 Event
    </button>
  </div>
</div>

{#if error}
  <div class="error">{error}</div>
{/if}

{#if success}
  <div class="success">{success}</div>
{/if}

<style>
  .nip65-relay-manager {
    margin: 20px;
  }

  .relay-list {
    margin-bottom: 10px;
  }

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

  .error {
    color: red;
  }

  .success {
    color: green;
  }
</style>
