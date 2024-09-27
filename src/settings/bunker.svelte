<script>
  import { finalizeEvent, nip04, Relay } from "nostr-tools";

  import Tooltip from "../components/tooltip/tooltip.svelte";

  import "./common.css";
  import { createKeyPair } from "../helpers/crypto";
  import { generateRandomHexString } from "../helpers/utils";
  import Loading from "../components/loading.svelte";

  export let nostrConnectSettings;

  let bunkerError = null;
  let bunkerSuccess = null;
  let bunkerLoading = false;

  async function connectToBunker() {
    try {
      bunkerLoading = true;

      const url = new URL(nostrConnectSettings.bunkerUrl);

      if (url.protocol !== "bunker:") {
        throw new Error("Invalid bunker URL: must start with bunker://");
      }

      const secret = url.searchParams.get("secret");
      const userPubkey = url.pathname.slice(2);
      const providerRelay = url.searchParams.get("relay");

      if (!userPubkey) {
        throw new Error("Invalid bunker URL: missing remote user pubkey");
      }

      nostrConnectSettings.userPubkey = userPubkey;

      if (!providerRelay) {
        throw new Error("Invalid bunker URL: relay is required");
      }

      nostrConnectSettings.providerRelay = providerRelay;

      if (!nostrConnectSettings.ephemeralKey) {
        const { secret, pubkey } = createKeyPair();

        nostrConnectSettings.ephemeralKey = secret;
        nostrConnectSettings.ephemeralPubkey = pubkey;
      }

      const id = generateRandomHexString(64);

      const encryptedMessage = await nip04.encrypt(
        nostrConnectSettings.ephemeralKey,
        userPubkey,
        JSON.stringify({
          id,
          method: "connect",
          params: secret ? [userPubkey, secret] : [userPubkey],
        }),
      );

      const eventTemplate = {
        kind: 24133,
        pubkey: nostrConnectSettings.ephemeralPubkey,
        content: encryptedMessage,
        tags: [["p", userPubkey]],
        created_at: Math.floor(Date.now() / 1000),
      };

      const signedEvent = finalizeEvent(
        eventTemplate,
        nostrConnectSettings.ephemeralKey,
      );

      const relay = new Relay(providerRelay);
      await relay.connect();

      await relay.publish(signedEvent);

      return new Promise((resolve, reject) => {
        const sub = relay.subscribe(
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

              let parsed;

              try {
                parsed = JSON.parse(decrypted);
              } catch (e) {
                bunkerError = e.message;

                reject(e);

                sub.close();

                return;
              }

              if (parsed.id !== id) {
                return;
              }

              if (parsed.result === "auth_url") {
                window.open(parsed.error, "_blank");
              } else if (parsed.result === "ack") {
                try {
                  bunkerSuccess = "Connected to bunker";

                  bunkerLoading = false;

                  resolve();
                } catch (e) {
                  bunkerError = e.message;

                  bunkerLoading = false;

                  reject(e);
                }

                sub.close();
              } else {
                bunkerError = parsed.error;

                bunkerLoading = false;

                reject(parsed.error);

                sub.close();
              }
            },
          },
        );
      });
    } catch (error) {
      bunkerError = error.message;

      bunkerLoading = false;
    }
  }

  async function testConnection() {
    if (!nostrConnectSettings.bunkerUrl) {
      bunkerSuccess = "";
      bunkerError = "Bunker URL is required";

      return;
    }

    if (!nostrConnectSettings.userPubkey) {
      bunkerSuccess = "";
      bunkerError = "User pubkey is required";

      return;
    }

    if (!nostrConnectSettings.providerRelay) {
      bunkerSuccess = "";
      bunkerError = "Provider relay is required";

      return;
    }

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
            bunkerError = "";
            bunkerSuccess = "Connection is successful!";
          } else if (parsed.result === "pong") {
            bunkerError = "";
            bunkerSuccess = "Ping? Pong! NostrConnect is working";
          } else {
            bunkerSuccess = "";
            bunkerError = `Unknown response: ${parsed.result}, ${parsed.error}`;
          }
        },
      },
    );
  }
</script>

<fieldset>
  <legend>Remote Signer Bunker Settings</legend>

  <a
    href="https://github.com/nostr-protocol/nips/blob/master/46.md"
    target="_blank"
    class="simple-tooltip"
    data-tooltip-text="Click to learn how do Remote Signers work"
  >
    What is a Remote Signer?
  </a>

  <a
    href="https://github.com/blackcoffeexbt/awesome-nip46-remote-nostr-signing-clients"
    target="_blank"
    class="simple-tooltip"
    data-tooltip-text="Click to learn more about Remote Signers"
  >
    Awesome NostrConnect/Remote Signing?
  </a>

  <div>
    <Tooltip
      title="Bunker URL"
      text="Copy the Bunker URL from your Remote Signer provider and paste it here."
    />

    <input
      type="text"
      id="bunker-url"
      class="flex-left"
      bind:value={nostrConnectSettings.bunkerUrl}
      placeholder="bunker://"
    />

    <button class="settings-button test-bunker" on:click={connectToBunker}>
      Connect
    </button>

    <button class="settings-button test-bunker" on:click={testConnection}>
      Test Connection
    </button>

    {#if bunkerLoading}
      <Loading
        size={20}
        strokeWidth={4}
        text={null}
        strokeColor="rgba(130 80 223 / 75%)"
      />
    {/if}
  </div>

  {#if bunkerError}
    <p class="error">{bunkerError}</p>
  {/if}
  {#if bunkerSuccess}
    <p class="success">{bunkerSuccess}</p>
  {/if}
</fieldset>

<style>
  .test-bunker {
    margin-top: 10px;
  }

  .error {
    color: red;
  }

  .success {
    color: green;
  }
</style>
