import { mergeSettings } from "./utils.js";
import {
  GetNostrizeAccountsReturn,
  NostrizeAccount,
  SaveNostrizeSettingsParams,
  Settings,
} from "./accounts.types";

export const defaultSettings: Settings = {
  version: 4,
  debug: {
    log: true,
    namespace: "[N]",
  },
  nostrSettings: {
    mode: "anon",
    relays: {
      local: {
        useRelays: true,
        relays: [
          {
            relay: "wss://relay.damus.io",
            enabled: true,
            read: true,
            write: true,
          },
          {
            relay: "wss://nostr.wine",
            enabled: true,
            read: true,
            write: false,
          },
          {
            relay: "wss://relay.snort.social",
            enabled: true,
            read: true,
            write: true,
          },
        ],
      },
      nip07: {
        useRelays: true,
      },
      nip65: {
        useRelays: true,
      },
    },
    nostrConnect: {
      url: "",
      customRelay: "",
      username: "",
      provider: "",
      providerRelay: "",
      metadata: {},
      userPubkey: "",
      userNip05: "",
      ephemeralKey: "",
      ephemeralPubkey: "",
    },
    openNostr: "https://nost.at",
  },
  lightsatsSettings: {
    apiKey: "",
    enabled: false,
  },
};

export async function saveNostrizeSettings(
  params: SaveNostrizeSettingsParams,
): Promise<void> {
  const { settings } = params;

  const { currentAccountId, accounts } = await getNostrizeAccounts();

  if (!currentAccountId) {
    return;
  }

  const account = accounts.find((account) => account.uuid === currentAccountId);

  if (!account) {
    throw new Error("Could not find current account in accounts array");
  }

  account.settings = settings;

  await chrome.storage.local.set({ accounts });
}

export async function getNostrizeSettings(): Promise<Settings> {
  const {
    accounts,
    currentAccountId,
  }: { accounts: NostrizeAccount[]; currentAccountId: string } =
    await chrome.storage.local.get(["accounts", "currentAccountId"]);

  if (!accounts || !currentAccountId || accounts.length === 0) {
    throw new Error("No accounts found");
  }

  const currentAccount = accounts.find(
    (account) => account.uuid === currentAccountId,
  );

  if (!currentAccount) {
    throw new Error("Could not find current account in accounts array");
  }

  if (!currentAccount.settings) {
    currentAccount.settings = defaultSettings;

    await chrome.storage.local.set({ accounts });

    return defaultSettings;
  }

  if (currentAccount.settings.version !== defaultSettings.version) {
    const mergedSettings: Settings = mergeSettings(
      currentAccount.settings,
      defaultSettings,
    ) as Settings;

    mergedSettings.version = defaultSettings.version;
    currentAccount.settings = mergedSettings;

    await chrome.storage.local.set({ accounts });

    return mergedSettings;
  }

  return currentAccount.settings;
}

export async function getNostrizeAccounts(): Promise<GetNostrizeAccountsReturn> {
  const { accounts, currentAccountId }: GetNostrizeAccountsReturn =
    await chrome.storage.local.get(["accounts", "currentAccountId"]);

  if (!accounts || !currentAccountId || accounts.length === 0) {
    return {
      accounts: [],
      currentAccountId: null,
    };
  }

  const currentAccount = accounts.find(
    (account) => account.uuid === currentAccountId,
  );

  if (!currentAccount) {
    throw new Error("Could not find current account in accounts array");
  }

  return {
    accounts,
    currentAccountId,
  };
}

/**
 * Adds a new Nostr account to the accounts array. Selects the new account as the current account.
 * @param account The NostrizeAccount to be added
 */
export async function addNewNostrizeAccount(account: NostrizeAccount) {
  const { accounts } = await getNostrizeAccounts();

  const existingAccount = accounts.find((a) => a.uuid === account.uuid);

  if (existingAccount) {
    throw new Error("Account already exists");
  }

  const newAccounts = [...accounts, account];

  await chrome.storage.local.set({
    accounts: newAccounts,
    currentAccountId: account.uuid,
  });
}

export async function setCurrentNostrizeAccount(account: NostrizeAccount) {
  await chrome.storage.local.set({ currentAccount: account.uuid });
}

export async function logOut() {
  await chrome.storage.local.set({ currentAccount: null });
}
