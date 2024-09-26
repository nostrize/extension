<script>
  import { finalizeEvent, nip04, SimplePool } from "nostr-tools";
  import { bytesToHex } from "@noble/hashes/utils";

  import { getNip65Relays } from "../helpers/nip65.js";
  import { generateRandomHexString } from "../helpers/utils.js";
  import { createKeyPair } from "../helpers/crypto.js";

  import "../settings/common.css";

  export let state;

  let bunkerRelays = [];
  let remotePubkey = "";
  let nip65Relays = [];
  let isLoading = false;
  let error = "";
  let success = "";

  async function connectToBunker() {
    isLoading = true;
    error = "";
    success = "";

    try {
      // Parse the bunker URL
      const url = new URL(state.nostrSettings.bunkerUrl);

      if (url.protocol !== "bunker:") {
        throw new Error("Invalid bunker URL: must start with bunker://");
      }

      remotePubkey = url.pathname.slice(2); // Remove the leading '//'
      bunkerRelays = url.searchParams.getAll("relay");
      const secret = url.searchParams.get("secret");

      if (!remotePubkey) {
        throw new Error("Invalid bunker URL: missing remote user pubkey");
      }

      if (bunkerRelays.length === 0) {
        throw new Error("Invalid bunker URL: at least one relay is required");
      }

      console.log("Connecting to bunker:", remotePubkey, bunkerRelays);

      // After successful connection, fetch the NIP-65 relays
      const { readRelays, writeRelays } = await getNip65Relays({
        pubkey: remotePubkey,
        relays: state.nostrSettings.relays,
      });

      nip65Relays = tags
        .filter((tag) => tag[0] === "r")
        .map((tag) => ({
          relay: tag[1],
          read: !tag[2] || tag[2] === "read",
          write: !tag[2] || tag[2] === "write",
        }));

      const { secret: ephemeralKey, pubkey: ephemeralPubkey } = createKeyPair();

      console.log("ephemeralKey", bytesToHex(ephemeralKey));
      console.log("ephemeralPubkey", ephemeralPubkey);

      const encryptedMessage = await nip04.encrypt(
        ephemeralKey,
        remotePubkey,
        JSON.stringify({
          id: generateRandomHexString(64),
          method: "connect",
          params: secret ? [remotePubkey, secret] : [remotePubkey],
        }),
      );

      console.log("encryptedMessage", encryptedMessage);

      // Client creates a NIP-65 event
      const eventTemplate = {
        kind: 24133,
        pubkey: ephemeralPubkey,
        content: encryptedMessage,
        tags: [["p", remotePubkey]],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signedEvent = finalizeEvent(eventTemplate, ephemeralKey);

      const pool = new SimplePool();

      const publishResult = await Promise.allSettled(
        pool.publish(bunkerRelays, signedEvent),
      );

      const rejectedRelays = publishResult.filter(
        (r) => r.status === "rejected",
      );

      const fulfilledRelays = publishResult.filter(
        (r) => r.status === "fulfilled",
      );

      if (rejectedRelays.length) {
        error = rejectedRelays.join(", ") + " failed to publish.";
      }

      if (fulfilledRelays.length) {
        success = fulfilledRelays.join(", ") + "succeed to publish";
      }

      // fetch the response
      const responseEvent = await pool.get(bunkerRelays, {
        kinds: [24133],
        authors: [remotePubkey],
        limit: 1,
      });

      console.log("event.content", responseEvent.content);

      const decrypted = await nip04.decrypt(
        ephemeralKey,
        remotePubkey,
        responseEvent.content,
      );

      console.log("decrypted", decrypted);

      let parsed;

      try {
        parsed = JSON.parse(decrypted);

        if (parsed.result === "ack") {
          success = "Connected to bunker";
        } else if (parsed.result === "auth_url") {
          window.open(parsed.error, "_blank");
        }
      } catch (e) {
        error = error.message;
      }

      isLoading = false;
    } catch (err) {
      console.error("Error connecting to bunker:", err);

      error = err.message;

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
    const { secret: ephemeralKey, pubkey: ephemeralPubkey } = createKeyPair();

    const relayListEvent = {
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

    const encryptedMessage = await nip04.encrypt(
      ephemeralKey,
      remotePubkey,
      JSON.stringify({
        id: generateRandomHexString(64),
        method: "sign_event",
        params: [JSON.stringify(relayListEvent)],
      }),
    );

    // Create a NIP-65 event
    const eventTemplate = {
      kind: 24133,
      pubkey: ephemeralPubkey,
      content: encryptedMessage,
      tags: [["p", remotePubkey]],
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

    const reply = await pool.get(bunkerRelays, {
      authors: [remotePubkey],
      kinds: [24133],
      "#p": [ephemeralPubkey],
    });

    console.log("reply", reply);
  }

  $: shortPubkey = remotePubkey.slice(0, 5) + "..." + remotePubkey.slice(-5);
</script>

<div class="nip65-relay-manager">
  <div class="row">
    <input
      type="text"
      bind:value={state.nostrSettings.bunkerUrl}
      placeholder="Enter bunker:// URL"
    />
    <button
      class="settings-button"
      on:click={connectToBunker}
      disabled={isLoading}
    >
      {isLoading ? "Connecting..." : "Connect to Bunker"}
    </button>
  </div>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if success}
    <p class="success">{success}</p>
  {/if}

  {#if remotePubkey}
    <p>
      Remote pubkey: {shortPubkey}
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
