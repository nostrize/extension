<script lang="ts">
  import { nip19 } from "nostr-tools";
  import { onMount } from "svelte";

  import { generateRandomHexString } from "../helpers/utils";
  import type {
    UnfetchedAccount,
    NostrizeAccount,
    Settings,
    NostrMode,
    FetchedAccount,
  } from "../helpers/accounts.types";
  import { getAccountIcon, getAccountName } from "../helpers/accounts";
  import { getNostrizeUserRelays } from "../helpers/relays";
  import { getCurrentTabUrl, settingsUrl } from "../helpers/browser";
  import {
    fetchFromNip05,
    getMetadataEvent,
    getNostrizeUserPubkey,
    publishEvent,
  } from "../helpers/nostr.js";
  import { Either } from "../helpers/either";
  import Loading from "../components/loading.svelte";
  import AccountList from "./account-list.svelte";
  import SectionItem from "./section-item.svelte";

  import "../settings/common.css";
  import { signEvent } from "../helpers/signer";

  export let accounts: NostrizeAccount[];
  export let defaultSettings: Settings;
  export let editingAccount: NostrizeAccount | null;

  export let handleAccountChange: (account: NostrizeAccount) => void;
  export let handleEditAccount: (account: NostrizeAccount) => void;
  export let handleNewAccount: (account: NostrizeAccount) => void;
  export let handleDeleteAccount: (account: NostrizeAccount) => void;
  export let getNostrModeLabel: (mode: NostrMode) => string;

  function createAccount() {
    const account: UnfetchedAccount = {
      kind: "unfetched",
      settings: defaultSettings,
      uuid: generateRandomHexString(8),
    };

    handleNewAccount(account);
  }

  let profileUrl: string | null = null;

  async function setNostrProfileUrl(account: FetchedAccount) {
    const canUseNip07 = (await getCurrentTabUrl()) !== settingsUrl;

    const { writeRelays } = await getNostrizeUserRelays({
      settings: account.settings,
      pubkey: account.pubkey,
      canUseNip07,
    });

    const nprofile = nip19.nprofileEncode({
      pubkey: account.pubkey,
      relays: writeRelays,
    });

    profileUrl = `${account.settings.nostrSettings.openNostr}/${nprofile}`;
  }

  if (editingAccount?.kind === "fetched") {
    setNostrProfileUrl(editingAccount);
  }

  function getMetadataBackup(account: NostrizeAccount) {
    return account.kind === "fetched"
      ? JSON.stringify(account.metadata)
      : JSON.stringify({
          name: account.name,
          icon: account.icon,
        });
  }

  let metadataBackup = editingAccount && getMetadataBackup(editingAccount);

  $: isDirty =
    editingAccount && getMetadataBackup(editingAccount) !== metadataBackup;

  function saveButtonClick() {
    if (editingAccount) {
      handleEditAccount(editingAccount);

      metadataBackup = getMetadataBackup(editingAccount);
    }
  }

  let publishError: string | null = null;
  let publishSuccess: string | null = null;
  let isPublishing = false;

  async function publishButtonClick() {
    if (!editingAccount) {
      publishError = "No account selected";

      return;
    }

    if (editingAccount.kind === "unfetched") {
      publishError = "Fetch your profile first to get your public key";

      return;
    }

    isPublishing = true;

    const metadataEventTemplate = {
      kind: 0,
      pubkey: editingAccount.pubkey,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: JSON.stringify(editingAccount.metadata),
    };

    const signedMetadataEvent = await signEvent({
      eventTemplate: metadataEventTemplate,
      mode: editingAccount.settings.nostrSettings.mode,
      nostrConnectSettings: editingAccount.settings.nostrSettings.nostrConnect,
    });

    const { writeRelays } = await getNostrizeUserRelays({
      settings: editingAccount.settings,
      pubkey: editingAccount.pubkey,
      canUseNip07: (await getCurrentTabUrl()) !== settingsUrl,
    });

    const { fulfilled } = await publishEvent({
      event: signedMetadataEvent,
      relays: writeRelays,
    });

    if (fulfilled.length === 0) {
      publishError = "Failed to publish profile";
    } else {
      publishSuccess = `Profile published successfully (${fulfilled.length}/${writeRelays.length} relays)`;
    }

    isPublishing = false;
    metadataBackup = getMetadataBackup(editingAccount);
  }

  function editButtonClick(account: NostrizeAccount) {
    editingAccount = account;

    metadataBackup = getMetadataBackup(editingAccount);
  }

  let fetchError: string | null = null;
  let isFetching = false;

  async function fetchProfile() {
    if (!editingAccount) {
      fetchError = "No account selected";

      return;
    }

    if (editingAccount.settings.nostrSettings.mode === "nip07") {
      fetchError =
        "NIP-07 accounts can't fetch their profile directly, use the link";

      return;
    }

    if (editingAccount.settings.nostrSettings.mode === "anon") {
      fetchError =
        "Anonymous accounts can't fetch their profile, please change your account mode";

      return;
    }

    isFetching = true;

    const pubkeyEither = await getNostrizeUserPubkey({
      mode: editingAccount.settings.nostrSettings.mode,
      nostrConnectSettings: editingAccount.settings.nostrSettings.nostrConnect,
    });

    if (Either.isLeft(pubkeyEither)) {
      fetchError = Either.getLeft(pubkeyEither);
      isFetching = false;

      return;
    }

    const pubkey = Either.getRight(pubkeyEither);

    const nostrizeUserRelays = await getNostrizeUserRelays({
      settings: editingAccount.settings,
      pubkey,
    });

    const metadataEvent = await getMetadataEvent({
      cacheKey: pubkey,
      filter: { authors: [pubkey], kinds: [0], limit: 1 },
      relays: nostrizeUserRelays.writeRelays,
    });

    if (metadataEvent) {
      const metadata = JSON.parse(metadataEvent.content);

      editingAccount = {
        ...editingAccount,
        kind: "fetched",
        metadata,
        pubkey,
      };
    } else {
      fetchError = "Failed to fetch profile";
    }

    isFetching = false;
  }

  let nip05Verified: boolean | null = null;
  let nip05VerifiedError: string | null = null;

  async function verifyNip05(event: Event) {
    if (!editingAccount) {
      nip05Verified = null;
      nip05VerifiedError = "No account selected";

      return;
    }

    if (editingAccount.kind === "unfetched") {
      nip05Verified = null;
      nip05VerifiedError = "Fetch your profile first to get your public key";

      return;
    }

    const input = event.currentTarget as HTMLInputElement;
    const value = input.value;

    const [username, domain] = value.split("@");

    const nip05Either = await fetchFromNip05({
      user: username,
      fetchUrl: `https://${domain}/.well-known/nostr.json?name=${username}`,
    });

    if (Either.isLeft(nip05Either)) {
      nip05Verified = false;
      nip05VerifiedError = Either.getLeft(nip05Either);

      return;
    }

    const { pubkey } = Either.getRight(nip05Either);

    nip05Verified = pubkey === editingAccount.pubkey;
  }

  function nip05Action(node: HTMLInputElement) {
    function handleInput() {
      verifyNip05({ currentTarget: node } as unknown as Event);
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

  let nip96Server: string | undefined;

  onMount(() => {
    nip96Server = editingAccount?.settings.nostrizeSettings.nip96.server;
  });

  function uploadNip98() {
    console.log("uploadNip98");
  }
</script>

<div class="account-manager">
  {#if accounts.length === 0}
    <div class="welcome-screen">
      <h2>Welcome to Nostrize!</h2>

      <p>
        Nostrize is a collection of tools and scripts that lets you use Nostr
        with your favorite platforms like X (Twitter), Youtube, Github, and
        more.
      </p>

      <p>You can also manage how you connect to the network with Nostrize</p>

      <p>Let's get started by creating your first Nostrize account.</p>

      <button
        class="settings-button create-account-btn"
        on:click={createAccount}
      >
        ➕ Create New Account
      </button>
    </div>
  {:else}
    <SectionItem title="Your Accounts" isExpanded={true}>
      <AccountList
        slot="content"
        {accounts}
        bind:editingAccount
        {editButtonClick}
        {handleAccountChange}
        {getAccountIcon}
        {getAccountName}
        {getNostrModeLabel}
        {handleDeleteAccount}
      />
    </SectionItem>

    {#if editingAccount}
      <SectionItem title="Edit Account" isExpanded={true}>
        <fieldset class="edit-account-form" slot="content">
          <legend>{getAccountName(editingAccount)}</legend>

          {#if editingAccount.kind === "unfetched"}
            {#if editingAccount.settings.nostrSettings.mode === "anon"}
              <div class="anon-account-note">
                Note: This is an anonymous account. The information you provide
                will only be used within the Nostrize extension to help you
                differentiate this account from others
              </div>
            {/if}

            <div class="input-container">
              <label for="name">Name:</label>
              <input
                type="text"
                id="name"
                bind:value={editingAccount.name}
                required
              />
            </div>

            <div class="input-container">
              <label for="icon">Account Picture URL:</label>
              <input type="url" id="icon" bind:value={editingAccount.icon} />
              {#if nip96Server}
                <label for="icon"
                  >Use upload service (NIP-98: {nip96Server}):</label
                >
                <input type="file" id="nip98" />
                <button on:click={uploadNip98}>Upload</button>
              {/if}
            </div>
          {:else if editingAccount.kind === "fetched"}
            <div class="input-container">
              <label for="pubkey">Public Key:</label>
              <input
                type="text"
                id="pubkey"
                bind:value={editingAccount.pubkey}
                disabled
              />
            </div>

            <div class="input-container">
              <label for="name">Name & Display Name:</label>
              <input
                type="text"
                id="name"
                bind:value={editingAccount.metadata.name}
              />
            </div>

            <div class="input-container">
              <div>
                <label for="nip05">Nostr Address (NIP-05):</label>
                <span
                  style={`display: ${nip05Verified === true ? "inline" : "none"};`}
                  class="simple-tooltip"
                  data-tooltip-text="This Nostr Address points to your pubkey"
                >
                  <img
                    src="verified.svg"
                    width="12"
                    height="12"
                    alt="Nostr Address is checked with your pubkey"
                    style="border-radius: 50%;"
                  />
                </span>
                <span
                  style={`display: ${nip05Verified === false ? "inline" : "none"};`}
                  class="simple-tooltip"
                  data-tooltip-text={nip05VerifiedError}
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
                type="text"
                id="nip05"
                bind:value={editingAccount.metadata.nip05}
                use:nip05Action
              />
            </div>

            <div class="input-container">
              <label for="icon">Account Picture URL:</label>
              <input
                type="url"
                id="icon"
                bind:value={editingAccount.metadata.picture}
              />
            </div>
          {/if}

          {#if editingAccount.settings.nostrSettings.mode === "nip07"}
            <a
              href="https://nostrize.me/pages/nip07-metadata-manager.html"
              target="_blank"
              class="simple-tooltip"
              data-tooltip-text="Nostrize can't directly fetch your profile within itself. Click to open the nostrize.me NIP-07 Profile Manager."
            >
              Fetch your profile
            </a>
          {:else if editingAccount.settings.nostrSettings.mode !== "anon"}
            <div style="display: flex; gap: 4px;">
              <div>
                <button
                  class="settings-button fetch-profile-btn"
                  on:click={fetchProfile}
                >
                  Fetch your profile
                </button>
              </div>
              <div>
                {#if isFetching}
                  <Loading
                    size={16}
                    strokeColor="darkseagreen"
                    textColor="darkseagreen"
                    text="Fetching..."
                  />
                {/if}
              </div>
            </div>

            {#if fetchError}
              <div class="fetch-error">{fetchError}</div>
            {/if}
          {/if}

          <div style="display: flex; gap: 4px; flex-wrap: no-wrap;">
            <button
              class="settings-button save-publish-btn"
              class:dirty={isDirty}
              on:click={saveButtonClick}
              disabled={!isDirty}
            >
              Save Profile
            </button>

            <button
              class="settings-button save-publish-btn"
              class:dirty={isDirty}
              on:click={publishButtonClick}
              disabled={!isDirty}
            >
              Publish Profile
            </button>

            {#if isPublishing}
              <Loading
                size={16}
                strokeColor="darkseagreen"
                textColor="darkseagreen"
                text="Publishing..."
              />
            {/if}

            <button
              type="button"
              class="settings-button cancel-btn"
              on:click={() => (editingAccount = null)}>Cancel</button
            >

            {#if publishError}
              <div class="fetch-error">{publishError}</div>
            {/if}

            {#if publishSuccess}
              <div class="fetch-success">{publishSuccess}</div>
            {/if}
          </div>

          <div>
            {#if profileUrl && editingAccount.kind === "fetched"}
              <a href={profileUrl} target="_blank">Open Nostr Profile </a>
            {/if}
          </div>
        </fieldset>
      </SectionItem>
    {/if}

    <button class="settings-button create-account-btn" on:click={createAccount}>
      ➕ Create New Account
    </button>
  {/if}
</div>

<style>
  .account-manager {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 300px;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }

  .welcome-screen {
    text-align: center;
    margin-top: 50px;
  }

  .create-account-btn {
    margin-top: 20px;
    background-color: rgba(130, 80, 223, 0.1);
    color: darkcyan;
  }

  .create-account-btn:hover {
    background-color: rgba(130, 80, 223, 0.25);
  }

  .anon-account-note {
    font-size: 0.8em;
  }

  .save-publish-btn {
    background-color: rgba(76, 175, 80, 0.8);
  }

  .save-publish-btn:not(.dirty) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .cancel-btn {
    background-color: rgba(244, 67, 54, 0.8);
  }

  .save-publish-btn:hover {
    background-color: rgba(76, 175, 80, 1);
  }

  .cancel-btn:hover {
    background-color: rgba(244, 67, 54, 1);
  }

  .fetch-error {
    color: red;
  }
</style>
