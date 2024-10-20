<script lang="ts">
  import type {
    NostrMode,
    NostrModeOption,
    NostrSettings,
  } from "../helpers/accounts.types";
  import Tooltip from "../components/tooltip/tooltip.svelte";
  import Bunker from "./bunker.svelte";
  import NostrConnect from "./nostr-connect.svelte";
  import Relays from "./relays.svelte";

  export let nostrSettings: NostrSettings;
  export let nostrModeOptions: Record<NostrMode, NostrModeOption>;
  export let isDirty = false;

  type NostrModeOptionEntries = [NostrMode, NostrModeOption][];

  const nostrModeOptionsEntries: NostrModeOptionEntries = Object.entries(
    nostrModeOptions,
  ) as NostrModeOptionEntries;

  const localRelays = nostrSettings.relays.local.relays
    .filter((relay) => relay.enabled)
    .map((relay) => relay.relay);

  let nostrSettingsHash = JSON.stringify(nostrSettings);

  $: isDirty = JSON.stringify(nostrSettings) !== nostrSettingsHash;

  function handleNostrModeSelect(value: NostrMode) {
    nostrSettings.mode = value;
  }

  export function rehashSettings() {
    nostrSettingsHash = JSON.stringify(nostrSettings);
  }
</script>

<div class="nostr-settings">
  <fieldset>
    <legend>
      <Tooltip
        title="Relays"
        text="Relay is a server which sends and receives content for users that subscribe to it"
      />
    </legend>
    <a href="https://stats.nostr.band/#relay_users" target="_blank"
      >Popular Nostr Relays</a
    >

    <a href="https://relays.xport.top" target="_blank">Xport Relay list</a>

    <Relays
      bind:relaysSettings={nostrSettings.relays}
      mode={nostrSettings.mode}
    />
  </fieldset>

  <fieldset>
    <legend>Mode</legend>

    <div class="custom-select">
      <div class="select-label">Select Mode</div>
      <div class="select-options">
        {#each nostrModeOptionsEntries as [key, option]}
          <button
            type="button"
            class="select-option simple-tooltip"
            data-tooltip-text={option.description}
            class:selected={nostrSettings.mode === key}
            on:click={() => handleNostrModeSelect(key)}
            on:keydown={(e) => e.key === "Enter" && handleNostrModeSelect(key)}
          >
            {option.label}
          </button>
        {/each}
      </div>
      {#if nostrSettings.mode === "nip07"}
        <div>
          <a
            href="https://nostrize.me/pages/nip07-metadata-manager.html"
            target="_blank"
            class="simple-tooltip"
            data-tooltip-text="Click to copy your NIP-07 metadata to your Nostrize account (like name, pubkey, icon, about)"
          >
            Copy NIP-07 Metadata to Nostrize
          </a>

          <a
            href="https://github.com/nostr-protocol/nips/blob/master/07.md"
            target="_blank"
            class="block simple-tooltip"
            data-tooltip-text="What is a NIP-07 browser extension?"
            style="margin-top: 10px;"
          >
            What is NIP-07?
          </a>

          <a
            href="https://addons.mozilla.org/en-US/firefox/addon/nos2x-fox/"
            target="_blank"
            class="block simple-tooltip"
            data-tooltip-text="Click to install NIP-07 Firefox Extension"
          >
            Install nos2x-fox Firefox Extension
          </a>

          <a
            href="https://chromewebstore.google.com/detail/nos2x/kpgefcfmnafjgpblomihpgmejjdanjjp"
            target="_blank"
            class="block simple-tooltip"
            data-tooltip-text="Click to install NIP-07 Chrome Extension"
          >
            Install nos2x Chrome Extension
          </a>

          <a
            href="https://getalby.com/"
            target="_blank"
            class="block simple-tooltip"
            data-tooltip-text="Alby Lightning Wallet also acts as a NIP-07 browser extension"
          >
            Install Alby Lightning Wallet
          </a>
        </div>
      {/if}
    </div>
  </fieldset>

  {#if nostrSettings.mode === "nostrconnect"}
    <NostrConnect
      bind:nostrConnectSettings={nostrSettings.nostrConnect}
      relays={localRelays}
    />
  {/if}

  {#if nostrSettings.mode === "bunker"}
    <Bunker bind:nostrConnectSettings={nostrSettings.nostrConnect} />
  {/if}

  <fieldset>
    <legend>Open Nostr Links</legend>

    <div>
      <Tooltip text="You can specify a URL to open nostr links" title="URL" />

      <input type="text" id="open-nostr" bind:value={nostrSettings.openNostr} />
    </div>
  </fieldset>
</div>

<style>
  .custom-select {
    position: relative;
  }

  .select-label {
    margin-bottom: 5px;
  }

  .select-options {
    display: flex;
    flex-direction: column;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .select-option {
    padding: 8px 12px;
    cursor: pointer;
    border: none;
    border-bottom: 1px solid black;
    position: relative;
  }

  .select-option:hover {
    background-color: rgba(130, 80, 223, 0.4);
  }

  .select-option:last-child {
    border-bottom: none;
  }

  .select-option.selected {
    background-color: rgba(130, 80, 223, 0.6);
    color: white;
  }
</style>
