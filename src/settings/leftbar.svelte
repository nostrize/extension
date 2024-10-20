<script lang="ts">
  import type { NostrizeAccount } from "../helpers/accounts.types";
  import AccountMenu from "./account-menu.svelte";
  import { getCurrentTabUrl, settingsUrl } from "../helpers/browser";

  export let setActiveSection: (section: string, icon: HTMLElement) => void;
  export let currentAccount: NostrizeAccount;
  export let accounts: NostrizeAccount[];
  export let changeAccount: (account: NostrizeAccount) => void;
  export let handleLogout;
  export let editingAccount: NostrizeAccount | null;
  export let expanded = false;
  export let handleUnsavedChanges: (
    callback?: () => void,
  ) => (e: MouseEvent) => void;

  let showOpenInTab = true;

  async function setShowOpenInTab() {
    const currentUrl = await getCurrentTabUrl();

    if (currentUrl === settingsUrl) {
      showOpenInTab = false;
    }
  }

  setShowOpenInTab();

  function toggleAccountMenu() {
    expanded = !expanded;
  }

  const iconClick = (section: string) => (event: MouseEvent) => {
    toggleAccountMenu();

    setActiveSection(section, event.currentTarget as HTMLElement);
  };
</script>

<nav class="sidebar" class:expanded>
  <div class="sidebar-content">
    <div class="account-container account" id="account">
      <AccountMenu
        {currentAccount}
        {accounts}
        {changeAccount}
        {handleLogout}
        {expanded}
        {handleUnsavedChanges}
        bind:editingAccount
        toggleMenu={toggleAccountMenu}
      />
    </div>

    <div class="icon-container">
      <button
        class="icon settings active simple-tooltip"
        data-tooltip-text="Settings"
        data-show-tooltip-right="true"
        on:click={iconClick("settings")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="24"
          height="24"
        >
          <path fill="none" d="M0 0h24v24H0z" />
          <path
            d="M12 1l9.5 5.5v11L12 23l-9.5-5.5v-11L12 1zm0 2.311L4.5 7.653v8.694L12 20.689l7.5-4.342V7.653L12 3.311zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
          />
        </svg>
      </button>
      <button
        class="icon tools simple-tooltip"
        on:click={iconClick("tools")}
        data-tooltip-text="Tools"
        data-show-tooltip-right="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="24"
          height="24"
        >
          <path fill="none" d="M0 0h24v24H0z" />
          <path
            d="M5.33 3.271a3.5 3.5 0 0 1 4.472 4.474L20.647 18.59l-2.122 2.121L7.68 9.867a3.5 3.5 0 0 1-4.472-4.474L5.444 7.63a1.5 1.5 0 1 0 2.121-2.121L5.329 3.27zm10.367 1.884l3.182-1.768 1.414 1.414-1.768 3.182-1.768.354-2.12 2.121-1.415-1.414 2.121-2.121.354-1.768zm-7.071 7.778l2.121 2.122-4.95 4.95A1.5 1.5 0 0 1 3.58 17.99l.097-.107 4.95-4.95z"
          />
        </svg>
      </button>
    </div>
  </div>

  {#if showOpenInTab}
    <a
      href={settingsUrl}
      title="Open Nostrize Settings in a tab"
      class="no-icon icon simple-tooltip"
      data-tooltip-text="Won't you like to see and edit the settings in a separate tab?"
      data-show-tooltip-right="true"
      target="_blank"
      on:click={handleUnsavedChanges()}
    >
      <img
        src="open-link.svg"
        height="24"
        width="24"
        alt="Open Nostrize Settings"
      />
    </a>
  {/if}
</nav>

<style>
  .sidebar {
    width: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-right: 10px;
    transition: width 0.3s ease;
  }

  .sidebar.expanded {
    width: 150px;
  }

  .sidebar-content {
    width: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 15px;
  }

  .icon {
    width: 40px;
    height: 40px;
    margin-bottom: 20px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 0;
    border-radius: 50%;
    transition: background-color 0.3s;
    background-color: rgba(130, 80, 223, 0.1);
    position: relative;
  }

  .icon:hover {
    background-color: rgba(130, 80, 223, 0.4);
  }

  .icon.active {
    background-color: rgba(130, 80, 223, 0.4);
  }

  .icon svg {
    width: 24px;
    height: 24px;
  }

  .account-container {
    width: 100%;
    margin-bottom: 10px;
  }
</style>
