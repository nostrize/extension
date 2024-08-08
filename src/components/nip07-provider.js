window.addEventListener("message", async (event) => {
  if (event.source !== window) {
    return;
  }

  const { from, type, eventTemplate } = event.data;

  if (
    !(
      from === "nostrize-zap-modal" &&
      type === "nip07-sign-request" &&
      !!eventTemplate
    )
  ) {
    return;
  }

  const signedEvent = await window.nostr.signEvent(eventTemplate);

  window.postMessage(
    { from: "nostrize-nip07-provider", type, signedEvent },
    "*",
  );
});

window.addEventListener("message", async (event) => {
  if (event.source !== window) {
    return;
  }

  const { type, from } = event.data;

  if (type !== "nip07-relays-request") {
    return;
  }

  if (from !== "nostrize") {
    return;
  }

  if (!window.nostr) {
    console.log("nostr was not loaded, sending empty relays");

    return window.postMessage(
      { from: "nostrize-nip07-provider", type, relays: [] },
      "*",
    );
  }

  const relaysEntries = await window.nostr.getRelays();
  const relays = Object.keys(relaysEntries);

  window.postMessage({ from: "nostrize-nip07-provider", type, relays }, "*");
});

window.addEventListener("message", async (event) => {
  if (event.source !== window) {
    return;
  }

  const { from, type } = event.data;

  if (!(from === "nostrize-zap-modal" && type === "nip07-pubkey-request")) {
    return;
  }

  const pubkey = await window.nostr.getPublicKey();

  window.postMessage({ from: "nostrize-nip07-provider", type, pubkey }, "*");
});
