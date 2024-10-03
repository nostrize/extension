export function getNip07Relays() {
  return new Promise((resolve) => {
    window.postMessage({ type: "nip07-relays-request", from: "nostrize" });

    window.addEventListener("message", (event) => {
      if (event.source !== window) {
        return;
      }

      const { from, type, readRelays, writeRelays, relaysEntries } = event.data;

      if (type !== "nip07-relays-request") {
        return;
      }

      if (from !== "nostrize-nip07-provider") {
        return;
      }

      return resolve({ readRelays, writeRelays, relaysEntries });
    });
  });
}

export async function getPubkeyFromNip07() {
  window.postMessage({
    from: "nostrize",
    type: "nip07-pubkey-request",
  });

  return new Promise((resolve) => {
    window.addEventListener("message", function (event) {
      if (event.source !== window) {
        return;
      }

      const { from, type, pubkey } = event.data;

      if (
        !(
          from === "nostrize-nip07-provider" &&
          type === "nip07-pubkey-request" &&
          !!pubkey
        )
      ) {
        return;
      }

      return resolve(pubkey);
    });
  });
}
