export async function fetchLud16AndLud06({
  relayUrl,
  log,
  subscriptionId,
  npub,
}) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(relayUrl);

    ws.onopen = () => {
      log("channel has opened");

      // fetch the latest profile of a user
      ws.send(
        JSON.stringify([
          "REQ",
          subscriptionId,
          { authors: [npub], kinds: [0], limit: 1 },
        ]),
      );
    };

    ws.onmessage = (event) => {
      log("event received", event);

      if (!event.data) {
        return reject("event.data is empty");
      }

      const nostrEvent = JSON.parse(event.data);

      if (!Array.isArray(nostrEvent)) {
        log("expected array but received", nostrEvent);

        return reject("expected array but received");
      }

      const nostrType = nostrEvent[0];
      const sId = nostrEvent[1];

      if (sId !== subscriptionId) {
        log(
          `Subscription ids dont match Expected: ${subscriptionId}, got: ${sId}`,
        );

        return reject("Subscription ids dont match");
      }

      if (nostrType === "EOSE") {
        ws.close(1000);
      } else if (nostrType === "CLOSED") {
        return;
      } else if (nostrType === "EVENT") {
        const e = nostrEvent[2];
        const rawContent = e.content;
        const contentJson = JSON.parse(rawContent);

        log("content", contentJson);

        const lud16 = contentJson.lud16;

        log(`lud16: ${lud16}`);

        return resolve([lud16, contentJson.lud06]);
      } else {
        log(`unexpected nostr event type received: ${nostrType}`);

        return reject("unexpected nostr event");
      }
    };

    ws.onclose = () => {
      console.log("Disconnected from relay");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  });
}
