<script lang="ts">
  import { Relay, SimplePool, verifyEvent } from "nostr-tools";
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
  import RemoveBtn from "./components/remove-btn.svelte";

  export let settings: Settings;
  export let isDirty;

  const nullifyExtra = <T,>(relay: T) => ({
    ...relay,
    checking: false,
    canConnect: null,
    connectionError: null,
    metadata_created_at: null,
    nip65_created_at: null,
  });

  let nostrizeUserPubkey: string | null = null;

  let nostrizeUserRelays: {
    readRelays: string[];
    writeRelays: string[];
  };

  type Nip65Relay = {
    relay: string;
    read: boolean;
    write: boolean;
    checking: boolean;
    canConnect: boolean | null;
    connectionError: string | null;
    metadata_created_at: string | null;
    nip65_created_at: string | null;
  };

  let nip65Relays: Nip65Relay[] = [];
  let latestNip65EventCreatedAt: string | null = null;
  let latestMetadataEventCreatedAt: string | null = null;

  let nip65RelaysBackup: string;

  $: isDirty =
    nip65RelaysBackup !== JSON.stringify(nip65Relays.map(nullifyExtra));

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
    nip65Relays = [
      ...nip65Relays,
      {
        relay: "",
        read: true,
        write: true,
        checking: false,
        canConnect: null,
        connectionError: null,
        metadata_created_at: null,
        nip65_created_at: null,
      },
    ];
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
    nip65Relays[index] = {
      relay: url,
      read: isRead,
      write: isWrite,
      checking: false,
      canConnect: null,
      connectionError: null,
      metadata_created_at: null,
      nip65_created_at: null,
    };

    setRelayFlagsForConnection(
      nip65Relays[index],
      index,
      checkForMetadata,
      checkForNip65Event,
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

          nip65Relays = response.flatRelays.map(nullifyExtra);

          nip65RelaysBackup = JSON.stringify(nip65Relays);

          latestNip65EventCreatedAt = response.createdAt
            ? new Date(response.createdAt * 1000).toISOString()
            : null;
        },
      });

      nip65Relays = response.flatRelays.map(nullifyExtra);

      nip65RelaysBackup = JSON.stringify(nip65Relays);

      latestNip65EventCreatedAt = response.createdAt
        ? new Date(response.createdAt * 1000).toISOString()
        : null;
    } catch (e) {
      if (e instanceof Error) {
        error = "Failed to load NIP-65 relays: " + e.message;
      } else {
        error = "Failed to load NIP-65 relays: " + String(e);
      }
    }
  }

  let isPublishing = false;

  async function publishNIP65Event() {
    if (!nostrizeUserPubkey) {
      error = "Failed to load user pubkey";

      return;
    }

    isPublishing = true;

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

    const publishPromises = nostrizeUserRelays.writeRelays.map(async (r) => {
      const relay = new Relay(r);

      await relay.connect();

      return relay
        .publish(signedEvent)
        .then(() => ({ status: "fulfilled", url: r }))
        .catch((reason) => {
          console.log(`Failed to publish to ${r}: ${reason}`);

          return {
            status: "rejected",
            reason: String(reason),
            url: r,
          };
        });
    });

    const res = await Promise.all(publishPromises);

    const publishedCount = res.filter((r) => r.status === "fulfilled").length;

    if (publishedCount === 0) {
      error = "Failed: Could not publish NIP-65 event to any relays";

      success = "";
    } else {
      error = "";
      success = "NIP-65 event published successfully";

      nip65RelaysBackup = JSON.stringify(nip65Relays.map(nullifyExtra));

      latestNip65EventCreatedAt = signedEvent.created_at;

      setTimeout(() => {
        success = "";
      }, 5000);
    }

    isPublishing = false;
  }

  async function setRelayFlagsForConnection(
    relay: Nip65Relay,
    relayIndex: number,
    checkForMetadata: boolean,
    checkForNip65Event: boolean,
  ) {
    if (!relay.relay.startsWith("ws://") && !relay.relay.startsWith("wss://")) {
      relay.canConnect = false;
      relay.connectionError = "Invalid relay URL";

      return;
    }

    if (!nostrizeUserPubkey) {
      relay.canConnect = false;
      relay.connectionError = "nostrizeUserPubkey is empty";

      return;
    }

    const r = new Relay(relay.relay);

    try {
      nip65Relays[relayIndex] = {
        ...relay,
        checking: true,
      };

      await r.connect();

      relay.canConnect = r.connected;

      nip65Relays[relayIndex] = {
        ...relay,
        checking: false,
      };

      if (checkForMetadata) {
        nip65Relays[relayIndex] = {
          ...relay,
          checking: true,
        };

        const subscription = r.subscribe(
          [{ authors: [nostrizeUserPubkey], kinds: [0], limit: 1 }],
          {
            onevent: (event) => {
              if (event.pubkey !== nostrizeUserPubkey) {
                relay.connectionError = "Event is not from the user";

                nip65Relays[relayIndex] = {
                  ...relay,
                  checking: false,
                };

                subscription.close();

                return;
              }

              if (!verifyEvent(event)) {
                relay.connectionError = "Event is not valid";

                nip65Relays[relayIndex] = {
                  ...relay,
                  checking: false,
                };

                subscription.close();

                return;
              }

              relay.metadata_created_at = new Date(
                event.created_at * 1000,
              ).toISOString();

              subscription.close();

              nip65Relays[relayIndex] = {
                ...relay,
                checking: false,
              };
            },
            onclose(reason) {
              console.log(`${relay.relay} subscription closed: ${reason}`);
            },
          },
        );
      }

      if (checkForNip65Event) {
        nip65Relays[relayIndex] = {
          ...relay,
          checking: true,
        };

        const subscription = r.subscribe(
          [{ authors: [nostrizeUserPubkey], kinds: [10002], limit: 1 }],
          {
            onevent: (event) => {
              if (event.pubkey !== nostrizeUserPubkey) {
                relay.connectionError = "Event is not from the user";

                nip65Relays[relayIndex] = {
                  ...relay,
                  checking: false,
                };

                subscription.close();

                return;
              }

              if (!verifyEvent(event)) {
                relay.connectionError = "Event is not valid";

                nip65Relays[relayIndex] = {
                  ...relay,
                  checking: false,
                };

                subscription.close();

                return;
              }

              relay.nip65_created_at = new Date(
                event.created_at * 1000,
              ).toISOString();

              subscription.close();

              nip65Relays[relayIndex] = {
                ...relay,
                checking: false,
              };
            },
            onclose(reason) {
              console.log(`${relay.relay} subscription closed: ${reason}`);
            },
          },
        );
      }
    } catch (e) {
      if (e instanceof Error) {
        relay.connectionError = e.message;
      } else {
        relay.connectionError = String(e);
      }

      relay.canConnect = false;

      nip65Relays[relayIndex] = {
        ...relay,
        checking: false,
      };

      console.log(
        `${relay.relay} can't connect: ${relay.canConnect}, error: ${relay.connectionError}`,
      );
    } finally {
      if (r.connected && !checkForMetadata && !checkForNip65Event) {
        r.close();

        console.log(
          `${relay.relay} closed: ${r.connected}, error: ${relay.connectionError}`,
        );
      }

      console.log(
        `${relay.relay} was already closed: ${r.connected}, error: ${relay.connectionError}`,
      );
    }
  }

  let checkForNip65Event = true;
  let checkForMetadata = true;

  async function checkRelays() {
    for (const [index, relay] of nip65Relays.entries()) {
      if (relay.canConnect === null) {
        await setRelayFlagsForConnection(
          relay,
          index,
          checkForMetadata,
          checkForNip65Event,
        );
      }
    }
  }

  async function fetchProfile() {
    if (!nostrizeUserPubkey) {
      error = "Failed to load user pubkey";

      return;
    }

    const pool = new SimplePool();

    const latestMetadataEvent = await pool.get(nostrizeUserRelays.writeRelays, {
      authors: [nostrizeUserPubkey],
      kinds: [0],
      limit: 1,
    });

    if (!latestMetadataEvent) {
      error = "Failed to load latest metadata event";

      return;
    }

    latestMetadataEventCreatedAt = new Date(
      latestMetadataEvent.created_at * 1000,
    ).toISOString();
  }

  function createdAtGreenOrRed(createdAt: string, latestCreatedAt: string) {
    return createdAt === latestCreatedAt ? "green" : "red";
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

  <div class="check-relays-container">
    <CustomCheckbox
      checked={checkForNip65Event}
      text="Check NIP-65 data"
      tooltip="Check your most recent NIP-65 data on the relay. You can then rebroadcast your latest NIP-65 data to update the relay."
      marginLeft="10px"
    />

    <CustomCheckbox
      checked={checkForMetadata}
      text="Check profile data"
      tooltip="Check your most recent profile data on the relay. You can then rebroadcast your latest profile data to update the relay."
      marginLeft="10px"
    />

    <button class="settings-button" on:click={checkRelays}>Check Relays</button>
    <button class="settings-button" on:click={fetchProfile}>
      Fetch Profile
    </button>
  </div>

  {#if nip65Relays.length > 0}
    <div class="relay-list">
      {#each nip65Relays as relay, index (relay.relay)}
        <div
          class="relay-row"
          class:success={relay.canConnect === true}
          class:error={relay.canConnect === false}
          class:waiting={relay.canConnect === null && relay.checking}
        >
          {#if relay.canConnect === null && relay.checking}
            <Loading
              size={16}
              text={null}
              textColor="green"
              strokeColor="green"
              marginLeft="4px"
              tooltipText="Checking connection with the relay"
              marginRight="4px"
            />
          {/if}

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

          <RemoveBtn onClick={() => removeRelay(index)} label="Remove" />
        </div>
        <div>
          {#if relay.connectionError}
            <div style="color: red;">{relay.connectionError}</div>
          {/if}

          {#if relay.metadata_created_at && latestMetadataEventCreatedAt}
            <div
              style="color: {createdAtGreenOrRed(
                relay.metadata_created_at,
                latestMetadataEventCreatedAt,
              )};"
            >
              Metadata created at: {relay.metadata_created_at}
            </div>
          {/if}

          {#if relay.nip65_created_at && latestNip65EventCreatedAt}
            <div
              style="color: {createdAtGreenOrRed(
                relay.nip65_created_at,
                latestNip65EventCreatedAt,
              )};"
            >
              NIP-65 created at: {relay.nip65_created_at}
            </div>
          {/if}
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

    {#if isPublishing}
      <Loading
        size={16}
        textColor="green"
        strokeColor="green"
        text="Publishing..."
        marginLeft="4px"
      />
    {/if}
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
    display: flex;
    flex-direction: column;
  }

  .relay-row {
    display: flex;
    gap: 5px;
    padding: 5px;
    transition: background-color 0.3s ease;
  }

  .relay-row.success {
    background-color: rgba(0, 255, 0, 0.2);
  }

  .relay-row.error {
    background-color: rgba(255, 0, 0, 0.2);
  }

  .relay-row.waiting {
    background-color: rgba(255, 255, 0, 0.5);
    animation: blink-waiting 1.5s linear infinite;
  }

  @keyframes blink-waiting {
    0% {
      background-color: rgba(255, 255, 0, 0.5);
    }
    50% {
      background-color: unset;
    }
    100% {
      background-color: rgba(255, 255, 0, 0.5);
    }
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

  .check-relays-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 10px;
  }

  .check-relays-container button {
    margin-left: 10px;
  }

  .error {
    color: red;
  }

  .success {
    color: green;
  }
</style>
