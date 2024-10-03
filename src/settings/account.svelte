<script lang="ts">
  import { onMount } from "svelte";

  import "./common.css";
  import type { NostrizeAccount } from "../helpers/accounts.types";
  import { getAccountIcon, getAccountName } from "../helpers/accounts";

  export let currentAccount: NostrizeAccount;
  export let accounts: NostrizeAccount[];
  export let changeAccount: (account: NostrizeAccount) => void;
  export let handleLogout: () => void;
  export let editingAccount: NostrizeAccount | null;
  export let expanded: boolean;
  export let toggleMenu: () => void;
  export let handleUnsavedChanges: (
    callback?: () => void,
  ) => (e: MouseEvent) => void;

  function handleClickOutside(event: MouseEvent) {
    if (expanded && !(event.target as Element).closest(".account-sidebar")) {
      toggleMenu();
    }
  }

  function logOut() {
    handleLogout();
  }

  function setCurrentAccount(account: NostrizeAccount) {
    changeAccount(account);
  }

  onMount(() => {
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  });
</script>

<nav class="account-sidebar" class:expanded>
  <div
    class="account-icon simple-tooltip"
    data-tooltip-text={getAccountName(currentAccount)}
    data-show-tooltip-right="true"
    role="button"
    class:expanded
    on:keydown={(e) => e.key === "Enter" && toggleMenu()}
    on:click={toggleMenu}
    tabindex="0"
  >
    <img
      class="account"
      src={getAccountIcon(currentAccount)}
      width="32"
      height="32"
      alt={getAccountName(currentAccount)}
    />
  </div>

  <div class="profile-menu">
    <button
      class="menu-item"
      on:click={handleUnsavedChanges(() => (editingAccount = currentAccount))}
    >
      <img
        src="edit-icon.svg"
        width="24"
        height="24"
        style="margin-right: 4px;"
        alt="Edit Account"
      />
      Edit Account
    </button>
    {#each accounts.filter((a) => a.uuid !== currentAccount.uuid) as account}
      <button
        class="menu-item"
        on:click={handleUnsavedChanges(() => setCurrentAccount(account))}
      >
        <img
          class="account"
          width="24"
          height="24"
          src={getAccountIcon(account)}
          alt={getAccountName(account)}
          style="margin-right: 4px;"
        />
        {getAccountName(account)}
      </button>
    {/each}
    <button class="menu-item" on:click={handleUnsavedChanges(logOut)}>
      <img
        src="logout-icon.svg"
        width="24"
        height="24"
        style="margin-right: 4px;"
        alt="Log out"
      />
      Log out
    </button>
  </div>
</nav>

<style>
  .account-sidebar {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: height 0.3s ease;
  }

  .account-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(130, 80, 223, 0.1);
    margin-bottom: 10px;
  }

  .account-icon.expanded {
    background-color: rgba(130, 80, 223, 0.4);
  }

  img.account {
    fill: #333;
    border-radius: 50%;
    object-fit: cover;
  }

  .profile-menu {
    display: none;
    min-width: 100px;
    flex-direction: column;
    width: 100px;
  }

  .expanded .profile-menu {
    display: flex;
  }

  .menu-item {
    background: none;
    border: none;
    padding: 10px;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: #333;
    transition: background-color 0.2s;
  }

  .menu-item:hover {
    background-color: rgba(130, 80, 223, 0.1);
  }
</style>
