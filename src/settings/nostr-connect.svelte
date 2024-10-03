<script>
  import { nip04, SimplePool, finalizeEvent, Relay } from "nostr-tools";

  import { fetchFromNip05 } from "../helpers/nostr";
  import { generateRandomHexString } from "../helpers/utils";
  import { Either } from "../helpers/either.ts";
  import { createKeyPair } from "../helpers/crypto";
  import {
    getNostrizeSettings,
    saveNostrizeSettings,
  } from "../helpers/accounts.ts";
  import Tooltip from "../components/tooltip/tooltip.svelte";
  import QrCode from "../components/qrCode.svelte";
  import Loading from "../components/loading.svelte";

  export let nostrConnectSettings;
  export let relays;

  console.log("nostrConnectSettings", nostrConnectSettings);

  let remoteSignerProvidersLoading = true;
  let remoteSignerProviders = [];

  async function loadRemoteSigners() {
    const pool = new SimplePool();

    remoteSignerProviders = await pool
      .querySync(relays, {
        kinds: [31990],
        "#k": ["24133"],
      })
      .then((providers) => {
        return (providers || [])
          .map((provider) => ({
            content: JSON.parse(provider.content),
            created_at: provider.created_at,
            pubkey: provider.pubkey,
          }))
          .filter((provider) => provider.content.nip05 && provider.content.name)
          .reduce((acc, provider) => {
            const existingProvider = acc.find(
              (p) => p.content.name === provider.content.name,
            );

            if (
              !existingProvider ||
              existingProvider.created_at < provider.created_at
            ) {
              return [
                ...acc.filter((p) => p.content.name !== provider.content.name),
                provider,
              ];
            }

            return acc;
          }, []);
      });

    remoteSignerProvidersLoading = false;
  }

  loadRemoteSigners();

  let providerMessageSuccess = "";
  let providerMessageError = "";
  let showAccountCreateButton = false;
  let nostrconnectError = "";
  let nostrconnectSuccess = "";

  function copyButtonClick(e) {
    window.focus();

    navigator.clipboard.writeText(nostrConnectSettings.url).then(() => {
      e.target.textContent = "✅";

      setTimeout(() => {
        e.target.textContent = "📋";
      }, 3000);
    });
  }

  function generateNostrConnectUrl(relay) {
    if (relay === "") {
      return "";
    }

    console.log("Generating NostrConnect URL");

    // Client creates a local keypair
    if (!nostrConnectSettings.ephemeralKey) {
      const { secret, pubkey } = createKeyPair();

      nostrConnectSettings.ephemeralKey = secret;
      nostrConnectSettings.ephemeralPubkey = pubkey;
    }

    nostrConnectSettings.metadata = {
      name: "Nostrize",
      description: "Sneak nostr to the web",
      url: "https://nostrize.me",
    };

    const url = new URL(
      [
        "nostrconnect://",
        nostrConnectSettings.ephemeralPubkey,
        "?relay=",
        relay,
        "&metadata=",
        encodeURIComponent(JSON.stringify(nostrConnectSettings.metadata)),
      ].join(""),
    );

    return url.toString();
  }

  async function testNostrConnect() {
    // Client creates a local keypair
    if (!nostrConnectSettings.ephemeralKey) {
      const { secret, pubkey } = createKeyPair();

      nostrConnectSettings.ephemeralKey = secret;
      nostrConnectSettings.ephemeralPubkey = pubkey;
    }

    const id = generateRandomHexString(64);

    const encryptedMessage = await nip04.encrypt(
      nostrConnectSettings.ephemeralKey,
      nostrConnectSettings.userPubkey,
      JSON.stringify({
        id,
        method: "ping",
        params: [nostrConnectSettings.userPubkey],
      }),
    );

    console.log("encryptedMessage.id", id);

    // Client creates a NIP-65 event
    const eventTemplate = {
      kind: 24133,
      pubkey: nostrConnectSettings.ephemeralPubkey,
      content: encryptedMessage,
      tags: [["p", nostrConnectSettings.userPubkey]],
      created_at: Math.floor(Date.now() / 1000),
    };

    const signedEvent = finalizeEvent(
      eventTemplate,
      nostrConnectSettings.ephemeralKey,
    );

    const r = new Relay(nostrConnectSettings.providerRelay);

    await r.connect();
    await r.publish(signedEvent);

    // fetch the response
    r.subscribe(
      [
        {
          kinds: [24133],
          authors: [nostrConnectSettings.userPubkey],
          "#p": [nostrConnectSettings.ephemeralPubkey],
          limit: 1,
        },
      ],
      {
        onevent: async (event) => {
          const decrypted = await nip04.decrypt(
            nostrConnectSettings.ephemeralKey,
            nostrConnectSettings.userPubkey,
            event.content,
          );

          const parsed = JSON.parse(decrypted);

          if (parsed.id !== id) {
            return;
          }

          if (parsed.result === "auth_url") {
            window.open(parsed.error, "_blank");
          } else if (parsed.result === "ack") {
            nostrconnectError = "";
            nostrconnectSuccess = "Connection is successful!";
          } else if (parsed.result === "pong") {
            nostrconnectError = "";
            nostrconnectSuccess = "Ping? Pong! NostrConnect is working";
          } else {
            nostrconnectError = `Unknown response: ${parsed.result}, ${parsed.error}`;
          }
        },
      },
    );
  }

  async function handleProviderChange() {
    if (nostrConnectSettings.provider === "custom") {
      showAccountCreateButton = false;
      providerMessageSuccess = "";
      providerMessageError = "";

      return;
    }

    const response = await fetchFromNip05({
      user: "_",
      fetchUrl: `https://${nostrConnectSettings.provider}/.well-known/nostr.json?name=_`,
    });

    if (Either.isRight(response)) {
      const nip05Response = Either.getRight(response);

      if (nip05Response.relays.length > 0) {
        nostrConnectSettings.providerRelay = nip05Response.relays[0];
      }
    }
  }

  async function handleUsernameInput() {
    if (
      !nostrConnectSettings.username ||
      !nostrConnectSettings.provider ||
      nostrConnectSettings.provider === "custom"
    ) {
      return;
    }

    const response = await fetchFromNip05({
      user: nostrConnectSettings.username,
      fetchUrl: `https://${nostrConnectSettings.provider}/.well-known/nostr.json?name=${nostrConnectSettings.username}`,
    });

    if (Either.isLeft(response)) {
      const error = Either.getLeft(response);

      if (error.message === "Failed to fetch") {
        providerMessageError = "Failed to fetch, try a different provider";
        providerMessageSuccess = "";

        showAccountCreateButton = false;
      } else {
        providerMessageError = `${nostrConnectSettings.username} not found, would you like to create an account in ${nostrConnectSettings.provider}?`;
        providerMessageSuccess = "";

        showAccountCreateButton = true;
      }

      nostrConnectSettings.url = "";
    } else {
      providerMessageSuccess =
        "User found, proceed with copying NostrConnect URL to the provider";
      providerMessageError = "";

      showAccountCreateButton = false;

      const { pubkey } = Either.getRight(response);

      nostrConnectSettings.userPubkey = pubkey;
      nostrConnectSettings.userNip05 = `${nostrConnectSettings.username}@${nostrConnectSettings.provider}`;
      nostrConnectSettings.url = generateNostrConnectUrl(
        nostrConnectSettings.providerRelay,
      );
    }
  }

  async function saveNostrConnectData(e) {
    const settings = await Either.getOrElseThrow({
      eitherFn: getNostrizeSettings,
    });

    await saveNostrizeSettings({
      settings: {
        ...settings,
        nostrSettings: {
          ...settings.nostrSettings,
          mode: "nostrconnect",
          nostrConnect: nostrConnectSettings,
        },
      },
    });

    e.target.textContent = "Saved ✅";

    setTimeout(() => {
      e.target.textContent = "Save NostrConnect Settings Only";
    }, 3000);
  }

  async function createNostrConnectAccount() {
    console.log(nostrConnectSettings.userNip05);
    console.log(nostrConnectSettings.providerRelay);

    const selectedRemoteSigner = remoteSignerProviders.find(
      (p) => p.content.nip05 === `_@${nostrConnectSettings.provider}`,
    );

    console.log(selectedRemoteSigner);

    if (!nostrConnectSettings.ephemeralKey) {
      const { secret, pubkey } = createKeyPair();

      nostrConnectSettings.ephemeralKey = secret;
      nostrConnectSettings.ephemeralPubkey = pubkey;
    }

    const id = generateRandomHexString(64);

    const encryptedMessage = await nip04.encrypt(
      nostrConnectSettings.ephemeralKey,
      selectedRemoteSigner.pubkey,
      JSON.stringify({
        id,
        method: "create_account",
        params: [nostrConnectSettings.username, nostrConnectSettings.provider],
      }),
    );

    const eventTemplate = {
      kind: 24133,
      pubkey: nostrConnectSettings.ephemeralPubkey,
      content: encryptedMessage,
      tags: [["p", selectedRemoteSigner.pubkey]],
      created_at: Math.floor(Date.now() / 1000),
    };

    const signedEvent = finalizeEvent(
      eventTemplate,
      nostrConnectSettings.ephemeralKey,
    );

    const r = new Relay(nostrConnectSettings.providerRelay);

    await r.connect();
    await r.publish(signedEvent);

    r.subscribe(
      [
        {
          kinds: [24133],
          authors: [selectedRemoteSigner.pubkey],
          limit: 1,
        },
      ],
      {
        onevent: async (event) => {
          const decrypted = await nip04.decrypt(
            nostrConnectSettings.ephemeralKey,
            selectedRemoteSigner.pubkey,
            event.content,
          );

          const parsed = JSON.parse(decrypted);

          if (parsed.id !== id) {
            return;
          }

          if (parsed.result === "ack") {
            nostrconnectError = "";
            nostrconnectSuccess = "Account created successfully!";
          } else if (parsed.result === "auth_url") {
            window.open(parsed.error, "_blank");
          } else if (!parsed.error) {
            nostrConnectSettings.userPubkey = parsed.pubkey;
            nostrConnectSettings.userNip05 = `${nostrConnectSettings.username}@${nostrConnectSettings.provider}`;
            nostrConnectSettings.url = generateNostrConnectUrl(
              nostrConnectSettings.providerRelay,
            );
          }
        },
      },
    );
  }

  function resetKeys() {
    nostrConnectSettings.ephemeralKey = null;
    nostrConnectSettings.ephemeralPubkey = null;

    nostrConnectSettings.url = generateNostrConnectUrl(
      nostrConnectSettings.providerRelay,
    );
  }
</script>

<fieldset>
  <legend>Remote Signer Settings</legend>

  <div>
    <a
      href="https://github.com/nostr-protocol/nips/blob/master/46.md"
      target="_blank"
      class="simple-tooltip"
      data-tooltip-text="Click to learn how Remote Signers work"
    >
      What is a Remote Signer?
    </a>
  </div>

  <div style="margin-bottom: 10px;">
    <a
      href="https://github.com/blackcoffeexbt/awesome-nip46-remote-nostr-signing-clients"
      target="_blank"
      class="simple-tooltip"
      data-tooltip-text="Click to learn more about Remote Signers"
    >
      Awesome NostrConnect/Remote Signing?
    </a>
  </div>

  <div>
    <label for="nostrconnect-provider">Remote Signer Provider</label>
    <div class="provider-input-row">
      {#if nostrConnectSettings.provider !== "custom"}
        <input
          type="text"
          id="nostrconnect-username"
          placeholder="Username"
          bind:value={nostrConnectSettings.username}
          on:blur={handleUsernameInput}
          on:input={handleUsernameInput}
        />
        <span class="at-symbol">@</span>
      {/if}
      <select
        id="nostrconnect-relay-options"
        bind:value={nostrConnectSettings.provider}
        on:change={async () => {
          await handleProviderChange();
          await handleUsernameInput();
        }}
      >
        <option value=""> Select a provider </option>
        {#each remoteSignerProviders as rs}
          <option value={rs.content.nip05.split("@")[1]}>
            {(rs.content.name || rs.content.display_name).toLowerCase()}
          </option>
        {/each}
        <option value="custom">Custom</option>
      </select>
      {#if remoteSignerProvidersLoading}
        <Loading
          size={20}
          strokeWidth={4}
          text={null}
          strokeColor="rgba(130 80 223 / 75%)"
        />
      {/if}
    </div>
  </div>
  {#if nostrConnectSettings.provider === "custom"}
    <div>
      <Tooltip
        title="Custom NostrConnect Relay URL"
        text="Enter the URL of the Nostr relay you want to connect to."
      />
      <input
        type="text"
        id="nostrconnect-relay"
        placeholder="wss://relay.example.com"
        bind:value={nostrConnectSettings.customRelay}
        on:input={() => {
          nostrConnectSettings.url = generateNostrConnectUrl(
            nostrConnectSettings.customRelay,
          );
        }}
      />
    </div>
  {/if}
  <div>
    {#if providerMessageSuccess}
      <p class="success">{providerMessageSuccess}</p>
    {/if}
    {#if providerMessageError}
      <p class="error">{providerMessageError}</p>
    {/if}
    {#if showAccountCreateButton}
      <div>
        <button class="settings-button" on:click={createNostrConnectAccount}>
          Create {nostrConnectSettings.provider} Account
        </button>
      </div>
    {/if}
  </div>

  <div>
    <Tooltip
      title="NostrConnect URL"
      text="Copy this URL to the NostrConnect provider (or use the QR code below), after that click on Test Connection."
    />

    <div class="flex-container">
      <input
        type="text"
        id="nostrconnect-url"
        class="flex-left"
        bind:value={nostrConnectSettings.url}
        readonly="readonly"
        placeholder="nostrconnect://"
      />
      <button class="copy-btn flex-right" on:click={copyButtonClick}>📋</button>
      <Tooltip
        title={null}
        text="Reset Keys and Regenerate URL"
        iconClick={resetKeys}
        iconText="🔄"
      />
    </div>
    {#if nostrConnectSettings.url}
      <div style="display: flex; justify-content: center; padding: 10px;">
        <QrCode width={200} bind:value={nostrConnectSettings.url} />
      </div>
    {/if}
    <button class="settings-button" on:click={testNostrConnect}>
      Test Connection
    </button>
    <button class="settings-button" on:click={saveNostrConnectData}>
      Save NostrConnect Settings Only
    </button>
  </div>

  {#if nostrconnectError}
    <p class="error">{nostrconnectError}</p>
  {/if}
  {#if nostrconnectSuccess}
    <p class="success">{nostrconnectSuccess}</p>
  {/if}
</fieldset>

<style>
  input[readonly] {
    background-color: #f0f0f0;
  }

  button.copy-btn {
    cursor: pointer;
    border: none;
    margin-left: 5px;
    padding: 0px;
    background-color: inherit;
  }

  .error {
    color: red;
  }

  .success {
    color: green;
  }

  .provider-input-row {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .provider-input-row input {
    flex: 1;
    min-width: 0;
  }

  .provider-input-row .at-symbol {
    font-weight: bold;
  }

  .provider-input-row select {
    flex: 2;
    min-width: 0;
  }
</style>
