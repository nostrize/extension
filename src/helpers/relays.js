import NDK, { NDKNip07Signer } from "@nostr-dev-kit/ndk";

// nostr relays
export const relays = [
  "wss://purplepag.es",
  "wss://nos.lol",
  "wss://relay.f7z.io",
  "wss://relay.damus.io",
  "wss://nostr.mom",
  "wss://nostr.terminus.money",
  "wss://atlas.nostr.land/",
  "wss://offchain.pub/",
];

// TODO: actually do the call to the backend service
export async function fetchUserLud16({ npub }) {
  const nip07signer = new NDKNip07Signer();

  const ndk = new NDK({
    explicitRelayUrls: relays,
    signer: nip07signer,
  });

  await ndk.connect(1000);

  const user = ndk.getUser({ npub });
  await user.fetchProfile();
  const profile = user.profile;

  console.log("profile", profile);

  // Call the backend service, which handles caching of user profile data
  return "dhalsim@blink.sv";
}
