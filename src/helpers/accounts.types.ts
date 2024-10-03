export type RelayConfig = {
  relay: string;
  enabled: boolean;
  read: boolean;
  write: boolean;
};

export type LocalRelaySettings = {
  useRelays: boolean;
  relays: RelayConfig[];
};

export type RelaySettings = {
  useRelays: boolean;
};

export type NostrConnectSettings = {
  url: string;
  bunkerUrl: string;
  customRelay: string;
  username: string;
  provider: string;
  providerRelay: string;
  metadata: Record<string, unknown>;
  userPubkey: string;
  userNip05: string;
  ephemeralKey: string;
  ephemeralPubkey: string;
};

export type NostrModeOption = { label: string; description: string };
export type NostrMode = "anon" | "nip07" | "nostrconnect" | "bunker";

export type NostrSettings = {
  mode: NostrMode;
  relays: {
    local: LocalRelaySettings;
    nip07: RelaySettings;
    nip65: RelaySettings;
  };
  nostrConnect: NostrConnectSettings;
  openNostr: string;
};

export type LightsatsSettings = {
  apiKey: string;
  enabled: boolean;
};

export type NostrizeSettings = {
  alwaysOpenInNewTab: boolean;
  debug: {
    enableLogging: boolean;
    namespace: string;
  };
};

export type Settings = {
  version: number;
  nostrSettings: NostrSettings;
  lightsatsSettings: LightsatsSettings;
  nostrizeSettings: NostrizeSettings;
};

export type AccountMetadata = Partial<{
  nip05: string;
  lud16: string;
  lud06: string;
  website: string;
  display_name: string;
  name: string;
  about: string;
  picture: string;
}>;

export type NostrizeAccount = UnfetchedAccount | FetchedAccount;
export type AccountKind = "unfetched" | "fetched";

type AbstractAccount = {
  uuid: string;
  settings: Settings;
  // TODO: uncomment this when we have a way to save the editing settings
  // editingSettings?: Settings;
};

export type UnfetchedAccount = AbstractAccount & {
  kind: "unfetched";
  name?: string;
  icon?: string;
};

export type FetchedAccount = AbstractAccount & {
  kind: "fetched";
  pubkey: string;
  metadata: AccountMetadata;
};
