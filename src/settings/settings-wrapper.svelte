<script lang="ts">
  import browser from "webextension-polyfill";
  import { onMount } from "svelte";

  import type {
    NostrizeAccount,
    NostrMode,
    NostrModeOption,
  } from "../helpers/accounts.types";
  import {
    getCurrentNostrizeAccount,
    getNostrizeAccounts,
    addNewNostrizeAccount,
    deleteNostrizeAccount,
    saveCurrentNostrizeAccount,
  } from "../helpers/accounts";
  import { Either } from "../helpers/either";
  import { defaultSettings } from "../helpers/accounts";
  import Settings from "./settings.svelte";
  import AccountManager from "./account-manager.svelte";

  let accounts: NostrizeAccount[] = [];
  let currentAccount: NostrizeAccount | null = null;
  let editingAccount: NostrizeAccount | null = null;

  const nostrModeOptions: Record<NostrMode, NostrModeOption> = {
    anon: {
      label: "Anonymous",
      description: "Generates new keys each time you need to sign an event.",
    },
    nip07: {
      label: "NIP-07",
      description:
        "Signs events and gets your nostr relays and public key using browser extensions like alby or nos2x.",
    },
    nostrconnect: {
      label: "NostrConnect",
      description: "Connect to remote signing providers or create new account.",
    },
    bunker: {
      label: "Bunker",
      description: "Copy a Bunker URL from a remote signing provider.",
    },
  };

  onMount(async () => {
    const accountsEither = await getNostrizeAccounts();

    accounts = Either.isRight(accountsEither)
      ? Either.getRight(accountsEither)
      : [];

    const accountEither = await getCurrentNostrizeAccount();

    currentAccount = Either.isRight(accountEither)
      ? Either.getRight(accountEither)
      : null;

    if (
      currentAccount &&
      currentAccount.settings.nostrizeSettings.alwaysOpenInNewTab
    ) {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      const settingsUrl = browser.runtime.getURL("nostrize-settings.html");

      if (tabs[0] && tabs[0].url !== settingsUrl) {
        browser.tabs.create({ url: settingsUrl });
      }
    }
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

    const index = accounts.findIndex((a) => a.uuid === account.uuid);

    if (index !== -1) {
      accounts[index] = account;
    } else {
      throw new Error("Account not found");
    }
  }

  function getNostrModeLabel(mode: NostrMode) {
    return nostrModeOptions[mode].label;
  }
</script>

{#if currentAccount && !editingAccount}
  <Settings
    bind:currentAccount
    bind:editingAccount
    {accounts}
    {handleAccountChange}
    {handleLogout}
    {getNostrModeLabel}
    {nostrModeOptions}
  />
{:else}
  <AccountManager
    bind:currentAccount
    bind:editingAccount
    {accounts}
    {defaultSettings}
    {getNostrModeLabel}
    {handleAccountChange}
    {handleNewAccount}
    {handleEditAccount}
    {handleDeleteAccount}
  />
{/if}
