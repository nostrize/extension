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

  // Optionally send a response back
  window.postMessage(
    { from: "nostrize-nip07-provider", type, signedEvent },
    "*",
  );
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

  // Optionally send a response back
  window.postMessage({ from: "nostrize-nip07-provider", type, pubkey }, "*");
});
