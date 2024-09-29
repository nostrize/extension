<script lang="ts">
  import { onMount } from "svelte";

  import {
    getCurrentNostrizeAccount,
    getNostrizeAccounts,
    addNewNostrizeAccount,
    deleteNostrizeAccount,
  } from "../helpers/accounts";
  import { Either } from "../helpers/either";
  import type { NostrizeAccount } from "../helpers/accounts.types";
  import { defaultSettings } from "../helpers/accounts";
  import Settings from "./settings.svelte";
  import AccountManager from "./account-manager.svelte";

  let accounts: NostrizeAccount[] = [];
  let currentAccount: NostrizeAccount | null = null;

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
    currentAccount = account;

    await chrome.storage.local.set({ currentAccountId: account.uuid });
  }

  async function handleLogout() {
    currentAccount = null;

    await chrome.storage.local.set({ currentAccountId: null });
  }

  async function handleNewAccount(account: NostrizeAccount) {
    await addNewNostrizeAccount(account);
  }

  async function handleDeleteAccount(account: NostrizeAccount) {
    await deleteNostrizeAccount(account);
  }
</script>

{#if currentAccount}
  <Settings {currentAccount} {accounts} {handleAccountChange} {handleLogout} />
{:else}
  <AccountManager
    {accounts}
    {currentAccount}
    {defaultSettings}
    {handleAccountChange}
    {handleNewAccount}
    {handleDeleteAccount}
  />
{/if}
