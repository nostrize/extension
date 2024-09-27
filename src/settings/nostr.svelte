<script>
  import Tooltip from "../components/tooltip/tooltip.svelte";
  import Bunker from "./bunker.svelte";
  import NostrConnect from "./nostr-connect.svelte";
  import Relays from "./relays.svelte";

  export let nostrSettings;
  export let isDirty = false;

  const localRelays = nostrSettings.relays.local.relays
    .filter((relay) => relay.enabled)
    .map((relay) => relay.relay);

  let nostrSettingsHash = JSON.stringify(nostrSettings);

  $: isDirty = JSON.stringify(nostrSettings) !== nostrSettingsHash;

  const nostrModeOptions = [
    {
      value: "anon",
      label: "Anonymous",
      description: "Generates new keys each time you need to sign an event.",
    },
    {
      value: "nip07",
      label: "NIP-07",
      description:
        "Signs events and gets your nostr relays and public key using browser extensions like alby or nos2x.",
    },
    {
      value: "nostrconnect",
      label: "NostrConnect",
      description: "Connect to remote signing providers or create new account.",
    },
    {
      value: "bunker",
      label: "Bunker",
      description: "Copy a Bunker URL from a remote signing provider.",
    },
  ];

  function handleOptionSelect(value) {
    nostrSettings.mode = value;
  }

  export function onSaveSettings() {
    nostrSettingsHash = JSON.stringify(nostrSettings);
  }
</script>

<div class="nostr-settings">
  <fieldset>
    <legend>Relays</legend>

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
        {#each nostrModeOptions as option}
          <button
            type="button"
            class="select-option simple-tooltip"
            data-tooltip-text={option.description}
            class:selected={nostrSettings.mode === option.value}
            on:click={() => handleOptionSelect(option.value)}
            on:keydown={(e) =>
              e.key === "Enter" && handleOptionSelect(option.value)}
          >
            {option.label}
          </button>
        {/each}
      </div>
      {#if nostrSettings.mode === "nip07"}
        <div>
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
