<script>
  import { onMount } from "svelte";

  import "./common.css";

  export let currentAccount;
  export let accounts;
  export let handleAccountChange;
  export let handleLogout;
  export let editingAccount;

  let expanded = false;

  function toggleMenu() {
    expanded = !expanded;
  }

  function handleClickOutside(event) {
    if (expanded && !event.target.closest(".profile-sidebar")) {
      expanded = false;
    }
  }

  function logOut() {
    handleLogout();
  }

  function setCurrentAccount(account) {
    handleAccountChange(account);
  }

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  });
</script>

<nav class="profile-sidebar" class:expanded>
  <div
    class="profile-icon"
    role="button"
    class:expanded
    on:keydown={(e) => e.key === "Enter" && toggleMenu()}
    on:click={toggleMenu}
    tabindex="0"
  >
    <div class="simple-tooltip" data-tooltip-text={currentAccount.name}>
      {#if currentAccount && currentAccount.picture}
        <img src={currentAccount.picture} alt={currentAccount.name} />
      {:else}
        <img src="user-icon.svg" alt={currentAccount.name} />
      {/if}
    </div>
  </div>

  <div class="profile-menu">
    <button
      class="menu-item"
      on:click={() => (editingAccount = currentAccount)}
    >
      <img src="user-edit.svg" width="24" height="24" alt="Edit Account" />
      Edit Account
    </button>
    {#each accounts.filter((a) => a.uuid !== currentAccount.uuid) as account}
      <button class="menu-item" on:click={() => setCurrentAccount(account)}>
        {#if account.picture}
          <img class="account-icon" src={account.picture} alt={account.name} />
        {:else}
          <img src="user-icon.svg" width="24" height="24" alt={account.name} />
        {/if}
        {account.name ? account.name : account.uuid}
      </button>
    {/each}
    <button class="menu-item" on:click={logOut}>
      <svg class="logout-icon" viewBox="0 0 24 24">
        <path
          d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
        />
      </svg>
      Log out
    </button>
  </div>
</nav>

<style>
  .profile-sidebar {
    width: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 0;
    transition: width 0.3s ease;
    overflow: hidden;
    margin-left: 10px;
  }

  .profile-sidebar.expanded {
    width: 200px;
  }

  .profile-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(130, 80, 223, 0.1);
    margin-bottom: 10px;
  }

  .profile-icon.expanded {
    background-color: rgba(130, 80, 223, 0.4);
  }

  .profile-icon img {
    width: 24px;
    height: 24px;
    fill: #333;
    object-fit: cover;
  }

  .profile-menu {
    display: none;
    min-width: 150px;
    flex-direction: column;
    width: 100%;
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

  .menu-item .account-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    margin-right: 10px;
  }

  .menu-item .logout-icon {
    width: 18px;
    height: 18px;
    margin-right: 10px;
    fill: #333;
  }
</style>
