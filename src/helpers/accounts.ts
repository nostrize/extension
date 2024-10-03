import { mergeSettings } from "./utils.js";
import type { NostrizeAccount, Settings } from "./accounts.types";
import { Either } from "./either";
import { Some } from "./some";

export const defaultSettings: Settings = {
  version: 5,
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
  nostrizeSettings: {
    alwaysOpenInNewTab: false,
  },
};

/**
 * Saves the Nostr settings for the current account.
 * @param settings The Nostr settings to be saved
 */
export async function saveNostrizeSettings(settings: Settings): Promise<void> {
  const currentAccountEither = await getCurrentNostrizeAccount();

  if (Either.isLeft(currentAccountEither)) {
    throw new Error(Either.getLeft(currentAccountEither));
  }

  const currentAccount = Either.getRight(currentAccountEither);

  currentAccount.settings = settings;

  await saveCurrentNostrizeAccount(currentAccount);
}

export async function getNostrizeSettings(): Promise<Either<string, Settings>> {
  const {
    accounts,
    currentAccountId,
  }: { accounts: NostrizeAccount[]; currentAccountId: string } =
    await chrome.storage.local.get(["accounts", "currentAccountId"]);

  if (!accounts || !currentAccountId || accounts.length === 0) {
    return Either.left("No accounts found");
  }

  const currentAccount = accounts.find(
    (account) => account.uuid === currentAccountId,
  );

  if (!currentAccount) {
    return Either.left("Could not find current account in accounts array");
  }

  if (!currentAccount.settings) {
    currentAccount.settings = defaultSettings;

    await chrome.storage.local.set({ accounts });

    return Either.right(defaultSettings);
  }

  if (currentAccount.settings.version !== defaultSettings.version) {
    const mergedSettings: Settings = mergeSettings(
      currentAccount.settings,
      defaultSettings,
    ) as Settings;

    mergedSettings.version = defaultSettings.version;
    currentAccount.settings = mergedSettings;

    await chrome.storage.local.set({ accounts });

    return Either.right(mergedSettings);
  }

  return Either.right(currentAccount.settings);
}

export async function getCurrentNostrizeAccount(): Promise<
  Either<string, NostrizeAccount>
> {
  const { currentAccountId } = await chrome.storage.local.get([
    "currentAccountId",
  ]);

  if (!currentAccountId) {
    return Either.left("Current account is not set");
  }

  const accountsEither = await getNostrizeAccounts();

  if (Either.isLeft(accountsEither)) {
    return accountsEither;
  }

  const accounts = Either.getRight(accountsEither);

  const currentAccount = accounts.find(
    (account) => account.uuid === currentAccountId,
  );

  if (!currentAccount) {
    return Either.left("Could not find current account in accounts array");
  }

  if (currentAccount.settings.version !== defaultSettings.version) {
    currentAccount.settings = mergeSettings(
      currentAccount.settings,
      defaultSettings,
    ) as Settings;

    currentAccount.settings.version = defaultSettings.version;
  }

  await chrome.storage.local.set({ accounts });

  return Either.right(currentAccount);
}

/**
 * Saves the current Nostrize account.
 * Saves the accounts array and the currentAccountId.
 * @param account The NostrizeAccount to be saved
 */
export async function saveCurrentNostrizeAccount(account: NostrizeAccount) {
  const accountsEither = await getNostrizeAccounts();

  if (Either.isLeft(accountsEither)) {
    await chrome.storage.local.set({
      accounts: [account],
      currentAccountId: account.uuid,
    });

    return;
  }

  const accounts = Either.getRight(accountsEither);

  const index = accounts.findIndex((a) => a.uuid === account.uuid);

  if (index === -1) {
    throw new Error("Could not find current account in accounts array");
  }

  accounts[index] = account;

  await chrome.storage.local.set({ accounts, currentAccountId: account.uuid });
}

export async function getNostrizeAccounts(): Promise<
  Either<string, NostrizeAccount[]>
> {
  const { accounts }: { accounts: NostrizeAccount[] } =
    await chrome.storage.local.get(["accounts"]);

  if (!accounts || accounts.length === 0) {
    return Either.left("No accounts found");
  }

  return Either.right(accounts);
}

/**
 * Adds a new Nostr account to the accounts array, and saves it.
 * Saves the new account as the current account.
 * @param account The NostrizeAccount to be added
 */
export async function addNewNostrizeAccount(account: NostrizeAccount) {
  const accountsEither = await getNostrizeAccounts();

  if (Either.isLeft(accountsEither)) {
    await chrome.storage.local.set({
      accounts: [account],
      currentAccountId: account.uuid,
    });

    return;
  }

  const accounts = Either.getRight(accountsEither);

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

/**
 * Deletes a Nostr account from the accounts array, and saves it.
 * If the account is the current account, it will set null as the currentAccountId.
 * @param uuid The uuid of the NostrizeAccount to be deleted
 */
export async function deleteNostrizeAccount(account: NostrizeAccount) {
  const accountsEither = await getNostrizeAccounts();

  if (Either.isLeft(accountsEither)) {
    throw new Error(Either.getLeft(accountsEither));
  }

  const accounts = Either.getRight(accountsEither);

  const index = accounts.findIndex((a) => a.uuid === account.uuid);

  if (index === -1) {
    throw new Error("Could not find account in accounts array");
  }

  const newAccounts = accounts.filter((_, i) => i !== index);

  const { currentAccountId } = await chrome.storage.local.get([
    "currentAccountId",
  ]);

  if (currentAccountId === account.uuid) {
    await chrome.storage.local.set({ currentAccountId: null });
  }

  await chrome.storage.local.set({ accounts: newAccounts });
}

export async function logOut() {
  await chrome.storage.local.set({ currentAccountId: null });
}

export function getAccountName(account: NostrizeAccount) {
  if (account.kind === "fetched") {
    return (
      account.metadata.display_name ||
      account.metadata.name ||
      `Account ${account.uuid}`
    );
  }

  return account.name || `Account ${account.uuid}`;
}

export function getAccountIcon(account: NostrizeAccount): string {
  if (account.kind === "fetched") {
    return Some(account.metadata.picture).getOrElse("user-icon.svg");
  }

  return Some(account.icon).getOrElse("user-icon.svg");
}
