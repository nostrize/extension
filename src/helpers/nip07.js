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
