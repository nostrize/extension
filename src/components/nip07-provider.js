// window.nostr.signEvent
window.addEventListener("message", async (event) => {
  if (event.source !== window) {
    return;
  }

  const { from, type, eventTemplate } = event.data;

  if (
    !(from === "nostrize" && type === "nip07-sign-request" && !!eventTemplate)
  ) {
    return;
  }

  if (!window.nostr) {
    console.log(`window.nostr is not defined. type: ${type}, from: ${from}`);

    return window.postMessage(
      { from: "nostrize-nip07-provider", type, signedEvent: null },
      "*",
    );
  }

  const signedEvent = await window.nostr.signEvent(eventTemplate);

  window.postMessage(
    { from: "nostrize-nip07-provider", type, signedEvent },
    "*",
  );
});

// window.nostr.getRelays
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
    console.log(
      `nostr was not loaded, sending empty relays. type: ${type}, from: ${from}`,
    );

    return window.postMessage(
      { from: "nostrize-nip07-provider", type, relays: [] },
      "*",
    );
  }

  const relaysEntries = await window.nostr.getRelays();

  const readRelays = [];
  const writeRelays = [];

  for (const [relayUrl, relay] of Object.entries(relaysEntries)) {
    if (relay.read) {
      readRelays.push(relayUrl);
    }

    if (relay.write) {
      writeRelays.push(relayUrl);
    }
  }

  window.postMessage(
    { from: "nostrize-nip07-provider", type, readRelays, writeRelays },
    "*",
  );
});

window.addEventListener("message", async (event) => {
  if (event.source !== window) {
    return;
  }

  const { from, type } = event.data;

  if (!(from === "nostrize" && type === "nip07-pubkey-request")) {
    return;
  }

  if (!window.nostr) {
    console.log(`window.nostr is not defined. type: ${type}, from: ${from}`);

    return window.postMessage(
      { from: "nostrize-nip07-provider", type, pubkey: null },
      "*",
    );
  }

  const pubkey = await window.nostr.getPublicKey();

  window.postMessage({ from: "nostrize-nip07-provider", type, pubkey }, "*");
});

// window.nostr.getPublicKey
window.addEventListener("message", async (event) => {
  if (event.source !== window) {
    return;
  }

  const { from, type } = event.data;

  if (!(from === "nostrize" && type === "nip07-pubkey-request")) {
    return;
  }

  if (!window.nostr) {
    console.log(`window.nostr is not defined. type: ${type}, from: ${from}`);

    return window.postMessage(
      { from: "nostrize-nip07-provider", type, pubkey: null },
      "*",
    );
  }

  const pubkey = await window.nostr.getPublicKey();

  window.postMessage({ from: "nostrize-nip07-provider", type, pubkey }, "*");
});
