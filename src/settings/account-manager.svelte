<script lang="ts">
  import { generateRandomHexString } from "../helpers/utils";
  import type {
    AnonAccount,
    NostrizeAccount,
    Settings,
  } from "../helpers/accounts.types";

  import "../settings/common.css";

  export let accounts: NostrizeAccount[];
  export let currentAccount: NostrizeAccount | null;
  export let defaultSettings: Settings;
  export let editingAccount: NostrizeAccount | null;

  export let handleAccountChange: (account: NostrizeAccount) => void;
  export let handleEditAccount: (account: NostrizeAccount) => void;
  export let handleNewAccount: (account: NostrizeAccount) => void;
  export let handleDeleteAccount: (account: NostrizeAccount) => void;

  function createAccount() {
    const account: AnonAccount = {
      kind: "anon",
      settings: defaultSettings,
      uuid: generateRandomHexString(8),
    };

    handleNewAccount(account);
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
    <h2>Your Accounts</h2>
    <ul class="account-list">
      {#each accounts as account (account.uuid)}
        <li class="account-item">
          <button
            class="account-select-btn"
            class:active={currentAccount &&
              currentAccount.uuid === account.uuid}
            on:click={() => handleAccountChange(account)}
          >
            {account.name || `Account ${account.uuid}`}
          </button>
          <button
            class="settings-button account-edit-btn"
            on:click={() => (editingAccount = account)}
          >
            <img
              src="user-edit.svg"
              width="16"
              height="16"
              alt="Edit Account"
            />
          </button>
          <button
            class="settings-button account-delete-btn"
            on:click={() => handleDeleteAccount(account)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              ></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </li>
      {/each}
    </ul>

    {#if editingAccount !== null}
      <fieldset class="edit-account-form">
        <legend>Edit Account</legend>
        <div class="input-container">
          <label for="name">Name:</label>
          <input
            type="text"
            id="name"
            bind:value={editingAccount.name}
            required
          />
        </div>
        {#if editingAccount.kind === "known"}
          <div class="input-container">
            <label for="pubkey">Public Key:</label>
            <input
              type="text"
              id="pubkey"
              bind:value={editingAccount.pubkey}
              required
            />
          </div>
        {/if}
        <div class="input-container">
          <label for="icon">Icon URL:</label>
          <input type="url" id="icon" bind:value={editingAccount.icon} />
        </div>
        <div class="flex-container">
          <button
            class="settings-button save-btn"
            on:click={() => editingAccount && handleEditAccount(editingAccount)}
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
  }

  .account-select-btn {
    flex-grow: 1;
    text-align: left;
    border: 1px solid #e0e0e0;
    border-radius: 5px;
    padding: 10px;
    margin-right: 10px;
    border: none;
    background-color: transparent;
  }

  .account-select-btn:hover {
    background-color: rgba(130, 80, 223, 0.4);
  }

  .account-delete-btn {
    background-color: rgba(139, 0, 0, 0.75);
  }

  .account-delete-btn:hover {
    background-color: rgba(139, 0, 0, 1);
  }

  .create-account-btn {
    margin-top: 20px;
    background-color: rgba(0, 128, 0, 1);
  }

  .create-account-btn:hover {
    background-color: rgba(0, 128, 0, 0.7);
  }

  .save-btn {
    background-color: #4caf50;
  }

  .cancel-btn {
    background-color: #f44336;
  }
</style>
