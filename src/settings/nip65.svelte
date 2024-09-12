<script>
  import {
    finalizeEvent,
    generateSecretKey,
    getPublicKey,
    nip04,
    SimplePool,
  } from "nostr-tools";

  import { getPageUserRelays } from "../helpers/relays.js";
  import { getLocalSettings } from "../helpers/local-cache.js";
  import { generateRandomHexString } from "../helpers/utils.js";

  let state;
  let bunkerUrl = "";
  let bunkerRelays = [];
  let remoteUserPubkey = "";
  let nip65Relays = [];
  let isLoading = false;
  let error = "";
  let success = "";
  async function initializeState() {
    state = await getLocalSettings();
  }

  initializeState();

  async function connectToBunker() {
    isLoading = true;
    error = "";
    success = "";

    try {
      // Parse the bunker URL
      const url = new URL(bunkerUrl);

      if (url.protocol !== "bunker:") {
        throw new Error("Invalid bunker URL: must start with bunker://");
      }

      remoteUserPubkey = url.pathname.slice(2); // Remove the leading '//'
      bunkerRelays = url.searchParams.getAll("relay");
      // const secret = url.searchParams.get('secret');

      if (!remoteUserPubkey) {
        throw new Error("Invalid bunker URL: missing remote user pubkey");
      }

      if (bunkerRelays.length === 0) {
        throw new Error("Invalid bunker URL: at least one relay is required");
      }

      console.log("Connecting to bunker:", remoteUserPubkey, bunkerRelays);

      // After successful connection, fetch the NIP-65 relays
      const { tags } = await getPageUserRelays({
        pubkey: remoteUserPubkey,
        relays: state.nostrSettings.relays,
      });

      nip65Relays = tags
        .filter((tag) => tag[0] === "r")
        .map((tag) => ({
          relay: tag[1],
          read: !tag[2] || tag[2] === "read",
          write: !tag[2] || tag[2] === "write",
        }));
    } catch (err) {
      console.error("Error connecting to bunker:", err);

      error = err.message;
    } finally {
      isLoading = false;
    }
  }

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

  async function publishNIP65Event() {
    // Client creates a local keypair
    const ephemeralKey = generateSecretKey();
    const ephemeralPubkey = getPublicKey(ephemeralKey);

    const relayListEvent = {
      kind: 10002,
      tags: nip65Relays
        .filter((r) => r.read || r.write)
        .map((r) => {
          return [
            "r",
            r.relay,
            r.read && !r.write ? "read" : !r.read && r.write ? "write" : null,
          ];
        }),
      created_at: Math.floor(Date.now() / 1000),
      content: "",
    };

    const encryptedMessage = await nip04.encrypt(
      ephemeralKey,
      ephemeralPubkey,
      JSON.stringify({
        id: generateRandomHexString(64),
        method: "sign_event",
        params: [JSON.stringify(relayListEvent)],
      }),
    );

    // Client creates a NIP-65 event
    const eventTemplate = {
      kind: 24133,
      pubkey: ephemeralPubkey,
      content: encryptedMessage,
      tags: [["p", remoteUserPubkey]],
      created_at: Math.floor(Date.now() / 1000),
    };

    const signedEvent = finalizeEvent(eventTemplate, ephemeralKey);

    const pool = new SimplePool();
    const res = await Promise.allSettled(
      pool.publish(bunkerRelays, signedEvent),
    );

    const publishedCount = res.filter((r) => r.status === "fulfilled").length;

    if (publishedCount === 0) {
      error = "Failed to publish NIP-65 event";
    } else {
      success = "NIP-65 event published successfully";

      setTimeout(() => {
        success = null;
      }, 5000);
    }
  }
</script>

<div class="nip65-relay-manager">
  <div class="row">
    <input
      type="text"
      bind:value={bunkerUrl}
      placeholder="Enter bunker:// URL"
    />
    <button on:click={connectToBunker} disabled={isLoading}>
      {isLoading ? "Connecting..." : "Connect to Bunker"}
    </button>
  </div>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if success}
    <p class="success">{success}</p>
  {/if}

  {#if remoteUserPubkey}
    <p>
      Connected as: {remoteUserPubkey.slice(0, 3)}...{remoteUserPubkey.slice(
        -3,
      )}
    </p>
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
          <button on:click={() => removeRelay(index)}>Remove</button>
        </div>
      {/each}
    </div>
    <div class="button-container">
      <button on:click={addRelay}>Add Relay</button>
      <button on:click={publishNIP65Event}>Publish NIP-65 Event</button>
    </div>
  {/if}
</div>

<style>
  .nip65-relay-manager {
    margin: 20px;
  }

  .relay-list {
    margin-bottom: 10px;
  }

  .relay-row,
  .row {
    display: flex;
    align-items: center;
    margin-bottom: 3px;
  }

  .row input,
  .row button {
    margin: 5px;
    padding: 5px;
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
</style>
