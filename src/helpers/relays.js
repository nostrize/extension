export function getRelays({ settings, timeout = 4000 }) {
  const shouldGetNip07Relays =
    settings.nostrSettings.mode === "nip07" &&
    settings.nostrSettings.nip07.useRelays;

  const localRelays = settings.nostrSettings.relays;

  if (shouldGetNip07Relays) {
    return new Promise((resolve) => {
      window.postMessage({ type: "nip07-relays-request", from: "nostrize" });

      if (timeout) {
        setTimeout(() => resolve(localRelays), timeout);
      }

      window.addEventListener("message", (event) => {
        if (event.source !== window) {
          return;
        }

        const { from, type, relays } = event.data;

        if (type !== "nip07-relays-request") {
          return;
        }

        if (from !== "nostrize-nip07-provider") {
          return;
        }

        return resolve([...new Set(relays.concat(localRelays))]);
      });
    });
  }

  return localRelays;
}
