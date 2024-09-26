<script>
  import Tooltip from "../components/tooltip/tooltip.svelte";
  import NostrConnect from "./nostr-connect.svelte";
  import Relays from "./relays.svelte";

  export let nostrSettings;
  export let relays;

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
      description: "Copy a Bunker URL from a NostrConnect provider.",
    },
  ];

  let selectedOptionDescription = "";

  function setSelectedOptionDescription(index) {
    selectedOptionDescription = nostrModeOptions[index].description;
  }

  function clearSelectedOptionDescription() {
    selectedOptionDescription = "";
  }

  function handleOptionSelect(value) {
    nostrSettings.mode = value;
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
        {#each nostrModeOptions as option, index}
          <button
            type="button"
            class="select-option"
            class:selected={nostrSettings.mode === option.value}
            on:click={() => handleOptionSelect(option.value)}
            on:mouseover={() => setSelectedOptionDescription(index)}
            on:focus={() => setSelectedOptionDescription(index)}
            on:mouseleave={clearSelectedOptionDescription}
            on:blur={clearSelectedOptionDescription}
            on:keydown={(e) =>
              e.key === "Enter" && handleOptionSelect(option.value)}
          >
            {option.label}
          </button>
        {/each}
      </div>
      {#if selectedOptionDescription}
        <div class="selected-tooltip">{selectedOptionDescription}</div>
      {/if}
    </div>
  </fieldset>

  {#if nostrSettings.mode === "nostrconnect"}
    <NostrConnect
      bind:nostrConnectSettings={nostrSettings.nostrConnect}
      {relays}
    />
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
  .selected-tooltip {
    position: absolute;
    top: 100%;
    left: 0;
    width: 92%;
    background-color: black;
    color: white;
    border-radius: 5px;
    padding: 10px;
    margin-top: 10px;
    font-size: 0.8em;
  }

  .select-option:hover {
    background-color: rgba(130, 80, 223, 0.4);
  }

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
  }

  .select-option:last-child {
    border-bottom: none;
  }

  .select-option.selected {
    background-color: rgba(130, 80, 223, 0.6);
    color: white;
  }
</style>
