<script lang="ts">
  import { onMount } from "svelte";

  import {
    getCurrentNostrizeAccount,
    getNostrizeAccounts,
    addNewNostrizeAccount,
    deleteNostrizeAccount,
    saveCurrentNostrizeAccount,
  } from "../helpers/accounts";
  import { Either } from "../helpers/either";
  import type { NostrizeAccount } from "../helpers/accounts.types";
  import { defaultSettings } from "../helpers/accounts";
  import Settings from "./settings.svelte";
  import AccountManager from "./account-manager.svelte";

  let accounts: NostrizeAccount[] = [];
  let currentAccount: NostrizeAccount | null = null;
  let editingAccount: NostrizeAccount | null = null;

  onMount(async () => {
    const accountsEither = await getNostrizeAccounts();

    accounts = Either.isRight(accountsEither)
      ? Either.getRight(accountsEither)
      : [];

    const accountEither = await getCurrentNostrizeAccount();

    currentAccount = Either.isRight(accountEither)
      ? Either.getRight(accountEither)
      : null;
  });

  async function handleAccountChange(account: NostrizeAccount) {
    await chrome.storage.local.set({ currentAccountId: account.uuid });

    currentAccount = account;
    editingAccount = null;
  }

  async function handleLogout() {
    await chrome.storage.local.set({ currentAccountId: null });

    currentAccount = null;
  }

  async function handleNewAccount(account: NostrizeAccount) {
    await addNewNostrizeAccount(account);

    currentAccount = account;
    accounts = [...accounts, account];
  }

  async function handleDeleteAccount(account: NostrizeAccount) {
    await deleteNostrizeAccount(account);

    currentAccount = null;
    accounts = accounts.filter((a) => a.uuid !== account.uuid);
  }

  async function handleEditAccount(account: NostrizeAccount) {
    await saveCurrentNostrizeAccount(account);

    currentAccount = account;
    const index = accounts.findIndex((a) => a.uuid === account.uuid);

    if (index !== -1) {
      accounts[index] = account;
    } else {
      throw new Error("Account not found");
    }
  }
</script>

{#if currentAccount && !editingAccount}
  <Settings
    {currentAccount}
    {accounts}
    {handleAccountChange}
    {handleLogout}
    bind:editingAccount
  />
{:else}
  <AccountManager
    {accounts}
    {currentAccount}
    {defaultSettings}
    {editingAccount}
    {handleAccountChange}
    {handleNewAccount}
    {handleEditAccount}
    {handleDeleteAccount}
  />
{/if}
