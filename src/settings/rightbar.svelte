<script>
  import { onMount } from "svelte";

  export let currentAccount;
  export let accounts;
  export let settings;
  export let handleAccountChange;
  export let handleLogout;

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
    {#if currentAccount && currentAccount.picture}
      <img src={currentAccount.picture} alt={currentAccount.name || "User"} />
    {:else}
      <svg viewBox="0 0 24 24">
        <path
          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
        />
      </svg>
    {/if}
    <span class="profile-name">
      {currentAccount ? currentAccount.name : "User"}
    </span>
  </div>
  <span class="user-mode">{settings.nostrSettings.mode}</span>

  <div class="profile-menu">
    {#each accounts.filter((a) => a.uuid !== currentAccount.uuid) as account}
      <button class="menu-item" on:click={() => setCurrentAccount(account)}>
        <img class="account-icon" src={account.picture} alt={account.name} />
        {account.name}
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
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .profile-icon svg {
    width: 24px;
    height: 24px;
    fill: #333;
  }

  .profile-name {
    display: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
  }

  .expanded .profile-name {
    display: block;
  }

  .user-mode {
    font-size: 0.8em;
    color: #666;
    margin-bottom: 10px;
  }

  .profile-menu {
    display: none;
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
