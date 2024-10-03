<script lang="ts">
  import { generateRandomHexString } from "../helpers/utils";
  import type {
    UnfetchedAccount,
    NostrizeAccount,
    Settings,
    NostrMode,
  } from "../helpers/accounts.types";

  import SectionItem from "./section-item.svelte";

  import "../settings/common.css";
  import { getAccountIcon, getAccountName } from "../helpers/accounts";

  export let accounts: NostrizeAccount[];
  export let currentAccount: NostrizeAccount | null;
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

  function isActiveAccount(account: NostrizeAccount) {
    return (
      (currentAccount && currentAccount.uuid === account.uuid) ||
      (editingAccount && editingAccount.uuid === account.uuid)
    );
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
      <ul class="account-list" slot="content">
        {#each accounts as account (account.uuid)}
          <li class="account-item">
            <button
              class="account-select-btn"
              class:active={isActiveAccount(account)}
              on:click={() => handleAccountChange(account)}
            >
              <div style="margin-top: 1px;">
                <img
                  src={getAccountIcon(account)}
                  width="16"
                  height="16"
                  alt={getAccountName(account)}
                  class="account"
                  style="margin-right: 4px;"
                />
              </div>
              <div style="margin-top: 2px;">
                {getAccountName(account)} ({getNostrModeLabel(
                  account.settings.nostrSettings.mode,
                )})
              </div>
            </button>
            <button
              class="settings-button account-edit-btn"
              on:click={() => (editingAccount = account)}
            >
              <img
                src="edit-icon.svg"
                width="16"
                height="16"
                alt="Edit Account"
              />
            </button>
            <button
              class="settings-button account-delete-btn"
              on:click={() => handleDeleteAccount(account)}
            >
              <img
                src="delete-icon.svg"
                width="16"
                height="16"
                alt="Delete Account"
              />
            </button>
          </li>
        {/each}
      </ul>
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
            </div>

            {#if editingAccount.settings.nostrSettings.mode === "nip07"}
              <a
                href="https://nostrize.me/pages/nip07-metadata-manager.html"
                target="_blank"
                class="simple-tooltip"
                data-tooltip-text="Nostrize can't directly fetch your profile within itself. Click to open the NIP-07 Metadata Manager."
              >
                Fetch your profile
              </a>
            {/if}
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
              <label for="name">Name:</label>
              <input
                type="text"
                id="name"
                bind:value={editingAccount.metadata.name}
                disabled
              />
            </div>

            <div class="input-container">
              <label for="nip05">Nostr Address (NIP-05):</label>
              <input
                type="text"
                id="nip05"
                bind:value={editingAccount.metadata.nip05}
                disabled
              />
            </div>

            <div class="input-container">
              <label for="icon">Account Picture URL:</label>
              <input
                type="url"
                id="icon"
                bind:value={editingAccount.metadata.picture}
                disabled
              />
            </div>
          {/if}

          <div class="flex-container">
            <button
              class="settings-button save-btn"
              on:click={() =>
                editingAccount && handleEditAccount(editingAccount)}
            >
              Save
            </button>
            <button
              type="button"
              class="settings-button cancel-btn"
              on:click={() => (editingAccount = null)}>Cancel</button
            >
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

  .account-list {
    list-style-type: none;
    padding: 0;
    width: 100%;
  }

  .account-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    gap: 10px;
  }

  .account-item > button {
    cursor: pointer;
  }

  .account-item > button.active {
    background-color: rgba(130, 80, 223, 0.4);
  }

  .account-select-btn {
    display: flex;
    flex-grow: 1;
    text-align: left;
    padding: 6px;
    border: none;
    background-color: transparent;
  }

  .account-select-btn:hover {
    background-color: rgba(130, 80, 223, 0.4);
  }

  img.account {
    border-radius: 50%;
    object-fit: cover;
  }

  .account-delete-btn {
    background-color: rgb(255 0 0 / 75%);
  }

  .account-delete-btn:hover {
    background-color: rgb(255 0 0 / 100%);
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

  .save-btn {
    background-color: #4caf50;
  }

  .cancel-btn {
    background-color: #f44336;
  }
</style>
