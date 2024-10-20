<script lang="ts">
  import type { NostrizeAccount, NostrMode } from "../helpers/accounts.types";
  import RemoveBtn from "./components/remove-btn.svelte";

  export let accounts: NostrizeAccount[];
  export let handleAccountChange: (account: NostrizeAccount) => void;
  export let getAccountIcon: (account: NostrizeAccount) => string;
  export let getAccountName: (account: NostrizeAccount) => string;
  export let getNostrModeLabel: (mode: NostrMode) => string;
  export let editingAccount: NostrizeAccount | null;
  export let editButtonClick: (account: NostrizeAccount) => void;
  export let handleDeleteAccount: (account: NostrizeAccount) => void;

  $: isActiveAccount = (account: NostrizeAccount) =>
    editingAccount?.uuid === account.uuid;
</script>

<div>
  <span>Select an account to login, edit or delete</span>
  <ul class="account-list">
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
          on:click={() => editButtonClick(account)}
        >
          <img src="edit-icon.svg" width="16" height="16" alt="Edit Account" />
        </button>
        <RemoveBtn onClick={() => handleDeleteAccount(account)} />
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
</div>

<style>
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

  .account-item > button:first-of-type {
    cursor: pointer;
  }

  .account-item > button:first-of-type.active {
    background-color: rgba(130, 80, 223, 0.4);
  }

  .account-item > button:first-of-type:hover {
    background-color: rgba(130, 80, 223, 0.6);
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
</style>
