/*
import { fetchUserLud16 } from "../../../helpers/relays";

window.nostrize = async () => {
  if (!window.nostr) {
    alert(
      "1. Please check the Nostrize extension documentation on how to set up your Nostrize",
    );

    throw new Error("NOSTR_NOT_DEFINED");
  }

  // check if user already set their lud16 in their profile
  const npub = await window.nostr.getPublicKey();
  const lud16 = await fetchUserLud16({ npub });

  if (!lud16) {
    alert(
      "2. Please check the Nostrize extension documentation on how to set up your Nostrize",
    );

    throw new Error("LUD16_NOT_DEFINED");
  }

  return lud16;
};
*/
