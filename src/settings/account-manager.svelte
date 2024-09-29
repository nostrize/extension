<script lang="ts">
  import { generateRandomHexString } from "../helpers/utils";
  import type {
    AnonAccount,
    NostrizeAccount,
    Settings,
  } from "../helpers/accounts.types";

  export let accounts;
  export let currentAccount;
  export let defaultSettings: Settings;

  export let handleAccountChange;
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
      <p>Get started by creating your first account.</p>
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
      {#each accounts as account (account.id)}
        <li class="account-item">
          <button
            class="account-select-btn"
            class:active={currentAccount && currentAccount.id === account.id}
            on:click={() => handleAccountChange(account)}
          >
            {account.name || `Account ${account.uuid}`}
          </button>
          <button
            class="settings-button account-delete-btn"
            on:click={() => handleDeleteAccount(account)}
          >
            Delete
          </button>
        </li>
      {/each}
    </ul>
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
  }

  .account-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    border: 1px solid #e0e0e0;
    border-radius: 5px;
    padding: 10px;
  }

  .account-select-btn {
    flex-grow: 1;
    text-align: left;
    padding: 10px;
    margin-right: 10px;
    border: none;
    background-color: transparent;
  }

  .account-select-btn.active {
    background-color: #e0e0e0;
  }

  .account-delete-btn {
    background-color: #f00;
  }

  .create-account-btn {
    margin-top: 20px;
  }
</style>
