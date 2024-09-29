export type DebugSettings = {
  log: boolean;
  namespace: string;
};

export type RelayConfig = {
  relay: string;
  enabled: boolean;
  read: boolean;
  write: boolean;
};

export type RelaySettings = {
  useRelays: boolean;
  relays?: RelayConfig[];
};

export type NostrConnectSettings = {
  url: string;
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

export type NostrMode = "anon" | "nip07" | "nostrconnect" | "bunker";

export type NostrSettings = {
  mode: NostrMode;
  relays: {
    local: RelaySettings;
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

export type Settings = {
  version: number;
  debug: DebugSettings;
  nostrSettings: NostrSettings;
  lightsatsSettings: LightsatsSettings;
};

export type NostrizeAccount = AnonAccount | KnownAccount;
export type AccountKind = "anon" | "known";

export type AnonAccount = {
  kind: "anon";
  uuid: string;
  name?: string;
  icon?: string;
  settings: Settings;
};

export type KnownAccount = {
  kind: "known";
  uuid: string;
  pubkey: string;
  name?: string;
  icon?: string;
  settings: Settings;
};
