<script lang="ts">
  import { SimplePool } from "nostr-tools";
  import { onMount } from "svelte";

  import type { Settings } from "../helpers/accounts.types.js";
  import { getNip65Relays } from "../helpers/nip65";
  import { signEvent } from "../helpers/signer.js";
  import { getNostrizeUserRelays } from "../helpers/relays.js";
  import { getNostrizeUserPubkey } from "../helpers/nostr.js";
  import { Either } from "../helpers/either";

  import Loading from "../components/loading.svelte";
  import CustomCheckbox from "../components/checkbox/custom-checkbox.svelte";

  import "../settings/common.css";

  export let settings: Settings;
  export let isDirty;

  let nostrizeUserPubkey: string | null = null;
  let nostrizeUserRelays: {
    readRelays: string[];
    writeRelays: string[];
  };

  let nip65Relays: { relay: string; read: boolean; write: boolean }[] = [];
  let nip65RelaysBackup: string;

  $: isDirty = nip65RelaysBackup !== JSON.stringify(nip65Relays);

  let isLoading = false;
  let error = "";
  let success = "";

  onMount(() => {
    loadNip65Relays();
  });

  function undoChanges() {
    nip65Relays = JSON.parse(nip65RelaysBackup);
  }

  function addRelay() {
    nip65Relays = [...nip65Relays, { relay: "", read: true, write: true }];
  }

  function removeRelay(index: number) {
    nip65Relays = nip65Relays.filter((_, i) => i !== index);
  }

  function updateRelay(
    index: number,
    url: string,
    isRead: boolean,
    isWrite: boolean,
  ) {
    nip65Relays = nip65Relays.map((relay, i) =>
      i === index
        ? { ...relay, relay: url, read: isRead, write: isWrite }
        : relay,
    );
  }

  async function loadNip65Relays() {
    isLoading = true;

    const nostrizeUserPubkeyEither = await getNostrizeUserPubkey({
      mode: settings.nostrSettings.mode,
      nostrConnectSettings: settings.nostrSettings.nostrConnect,
    });

    if (Either.isLeft(nostrizeUserPubkeyEither)) {
      error =
        "Failed to load user pubkey: " +
        Either.getLeft(nostrizeUserPubkeyEither);

      isLoading = false;

      return;
    }

    nostrizeUserPubkey = Either.getRight(nostrizeUserPubkeyEither) as string;

    try {
      nostrizeUserRelays = await getNostrizeUserRelays({
        settings,
        pubkey: nostrizeUserPubkey,
      });
    } catch (e) {
      if (e instanceof Error) {
        error = "Failed to load user relays: " + e.message;
      } else {
        error = "Failed to load user relays: " + String(e);
      }
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
      if (e instanceof Error) {
        error = "Failed to load NIP-65 relays: " + e.message;
      } else {
        error = "Failed to load NIP-65 relays: " + String(e);
      }
    }

    nip65RelaysBackup = JSON.stringify(nip65Relays);
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
  <div>
    {#if isLoading}
      <Loading />
    {/if}
  </div>

  <div style="margin-bottom: 10px;">
    <a
      href="https://github.com/nostr-protocol/nips/blob/master/65.md"
      target="_blank"
      class="simple-tooltip"
      data-tooltip-text="Click to learn more about NIP-65 Relay Lists"
    >
      What is NIP-65?
    </a>
  </div>

  {#if nip65Relays.length > 0}
    <div class="relay-list">
      {#each nip65Relays as relay, index}
        <div class="relay-row">
          <input
            type="text"
            value={relay.relay}
            on:change={(e) =>
              updateRelay(
                index,
                e.currentTarget.value,
                relay.read,
                relay.write,
              )}
          />

          <CustomCheckbox
            checked={relay.read}
            onclick={(value) =>
              updateRelay(index, relay.relay, value, relay.write)}
            tooltip="Read"
          />

          <CustomCheckbox
            checked={relay.write}
            onclick={(value) =>
              updateRelay(index, relay.relay, relay.read, value)}
            tooltip="Write"
          />

          <button class="settings-button" on:click={() => removeRelay(index)}>
            Remove
          </button>
        </div>
      {/each}
    </div>
  {/if}

  <div class="button-container">
    <button class="settings-button" on:click={addRelay}>Add Relay</button>
  </div>

  <div class="button-container">
    <button
      id="undo-button"
      class="settings-button"
      class:dirty={isDirty}
      on:click={undoChanges}
      disabled={!isDirty}
    >
      Undo
    </button>
    <button
      id="publish-button"
      class="settings-button"
      class:dirty={isDirty}
      on:click={publishNIP65Event}
      disabled={!isDirty}
    >
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
    margin: 5px 20px 20px 20px;
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
    margin-right: 10px;
  }

  button {
    margin-left: 3px;
  }

  #publish-button {
    background-color: rgba(0, 128, 0, 0.75);
  }

  #publish-button:hover {
    background-color: rgba(0, 128, 0, 1);
  }

  #publish-button.dirty {
    opacity: 1;
  }

  #publish-button:not(.dirty) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  #undo-button.dirty {
    opacity: 1;
  }

  #undo-button:not(.dirty) {
    opacity: 0.5;
    cursor: not-allowed;
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
