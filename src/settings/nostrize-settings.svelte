<script lang="ts">
  import type { NostrizeSettings } from "../helpers/accounts.types";

  import CustomCheckbox from "../components/checkbox/custom-checkbox.svelte";

  import "./common.css";
  import Tooltip from "../components/tooltip/tooltip.svelte";

  export let nostrizeSettings: NostrizeSettings;
  export let isDirty = false;

  let nostrizeSettingsHash = JSON.stringify(nostrizeSettings);

  $: isDirty = JSON.stringify(nostrizeSettings) !== nostrizeSettingsHash;

  export function rehashSettings() {
    nostrizeSettingsHash = JSON.stringify(nostrizeSettings);
  }

  let nip96Verified: boolean | null = null;
  let nip96Error: string | null = null;

  function nip96Action(node: HTMLInputElement) {
    async function handleInput() {
      let response;

      try {
        response = await fetch(`${node.value}/.well-known/nostr/nip96.json`);
      } catch (e) {
        nip96Verified = false;

        if (e instanceof Error) {
          nip96Error = e.message;
        }

        if (typeof e === "string") {
          nip96Error = e;
        }

        return;
      }

      if (response.ok) {
        await response.json();

        nip96Verified = true;

        nostrizeSettings.nip96.server = node.value;
      } else {
        nip96Verified = false;
        nip96Error = "Invalid NIP-96 server";
      }
    }

    // Verify on initial load
    setTimeout(handleInput, 0);

    // Add event listener for subsequent changes
    node.addEventListener("input", handleInput);

    return {
      destroy() {
        node.removeEventListener("input", handleInput);
      },
    };
  }
</script>

<div class="nostrize-settings">
  <fieldset>
    <legend>Open This Page (Settings)</legend>
    <CustomCheckbox
      id="alwaysOpenInNewTab"
      text="Always In A New Tab"
      bind:checked={nostrizeSettings.alwaysOpenInNewTab}
    />
  </fieldset>

  <fieldset id="debug-settings-logging">
    <legend>Logging</legend>
    <CustomCheckbox
      id="log"
      text="Enable Logging"
      bind:checked={nostrizeSettings.debug.enableLogging}
    />

    <div>
      <Tooltip
        text="This helps in identifying Nostrize logs."
        title="Namespace"
      />

      <input
        type="text"
        id="namespace"
        placeholder="Namespace"
        bind:value={nostrizeSettings.debug.namespace}
      />
    </div>
  </fieldset>

  <fieldset>
    <legend>
      <Tooltip
        title="NIP-96"
        text="NIP-96 is a protocol for storage servers intended to be used in conjunction with the nostr network."
      />
    </legend>

    <div>
      <label for="nip96-server">NIP-96 Server:</label>
      <span
        style={`display: ${nip96Verified === true ? "inline" : "none"};`}
        class="simple-tooltip"
        data-tooltip-text="This is a NIP-96 compatible server URL"
      >
        <img
          src="verified.svg"
          width="12"
          height="12"
          alt="This is a NIP-96 compatible server URL"
          style="border-radius: 50%;"
        />
      </span>
      <span
        style={`display: ${nip96Verified === false ? "inline" : "none"};`}
        class="simple-tooltip"
        data-tooltip-text={"NIP-96 verification failed: " + nip96Error}
      >
        <img
          src="not-verified.svg"
          width="12"
          height="12"
          alt="Nostr Address and pubkey check failed"
          style="border-radius: 50%;"
        />
      </span>
    </div>

    <input
      id="nip96-server"
      type="text"
      placeholder="Service URL"
      bind:value={nostrizeSettings.nip96.server}
      use:nip96Action
    />

    <CustomCheckbox
      text="Enable NIP-96"
      bind:checked={nostrizeSettings.nip96.enabled}
    />

    {#if nostrizeSettings.nip96.server}
      <a href={nostrizeSettings.nip96.server} target="_blank">
        Open Your NIP-98 Service
      </a>
    {/if}

    <a
      href="https://github.com/quentintaranpino/NIP96-compatible-servers"
      target="_blank"
    >
      NIP-96 Compatible Servers
    </a>
  </fieldset>
</div>
