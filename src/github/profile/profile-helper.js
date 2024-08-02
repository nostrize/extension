import {
  Either,
  generateRandomHexString,
  satsToMilliSats,
} from "../../helpers/utils.js";

export const createSatsOptionButton = (button) => (sats) => {
  return button({
    text: sats.toString(),
    classList: "n-sats-option-btn",
    onclick: () => {
      document.getElementById("n-modal-amount").value = sats;
    },
  });
};

export async function getZapEndpoint({ metadataEvent, log }) {
  try {
    let { lud16 } = JSON.parse(metadataEvent.content);

    if (lud16) {
      const [name, domain] = lud16.split("@");

      const lnurl = new URL(
        `/.well-known/lnurlp/${name}`,
        `https://${domain}`,
      ).toString();

      const res = await fetch(lnurl);
      const body = await res.json();

      log(`fetch ${lnurl}`, body);

      if (body.allowsNostr && body.nostrPubkey) {
        return Either.right(body);
      } else {
        return Either.left("allowsNostr or nostrPubkey is not present");
      }
    } else {
      return Either.left("Could not find lud16 from kind0 event");
    }
  } catch (err) {
    return Either.left(err.toString());
  }
}

export async function fetchFromNip05({ user, fetchUrl }) {
  try {
    const response = await fetch(fetchUrl);

    if (!response.ok) {
      return Either.left(
        `nip05 fetch response error with status: ${response.status}`,
      );
    }

    const json = await response.json();
    const pubkey = json["names"][user];

    if (!pubkey) {
      return Either.left(
        `could not find pubkey for user ${user} in nostr.json`,
      );
    }

    const relays = json["nip46"][pubkey] || [];

    return Either.right({ pubkey, relays });
  } catch (error) {
    return Either.left(`nip05 fetch error ${error}`);
  }
}

export async function generateInvoiceButtonClick({
  sats,
  comment,
  fetchOneEvent,
  finalizeEvent,
  log,
  makeZapRequest,
  metadataEvent,
  paidMessagePlaceholder,
  qrCode,
  qrCodeContainer,
  recipient,
  relayFactory,
  nostrSettings,
  nip46,
  user,
  zapEndpoint,
}) {
  const milliSats = satsToMilliSats({ sats });

  // will be used for querying
  const randomEventIndex = generateRandomHexString(64);

  const eventTemplate = await makeZapRequest({
    profile: metadataEvent.pubkey,
    event: randomEventIndex,
    amount: milliSats,
    comment,
    relays: [nostrSettings.nostrRelayUrl],
  });

  // sign zap event anonymously for now
  // TODO: experiment with NIP-46
  const zapRequestEvent = nostrSettings.useNostrAnon
    ? finalizeEvent(eventTemplate, nip46.localNostrKeys.secret)
    : null;

  if (!zapRequestEvent) {
    throw new Error("not implemented");
  }

  log("zapRequestEvent", zapRequestEvent);

  const url = `${zapEndpoint}?amount=${milliSats}&nostr=${encodeURIComponent(
    JSON.stringify(zapRequestEvent),
  )}&comment=${encodeURIComponent(comment)}`;

  const res = await fetch(url);
  const { pr: invoice } = await res.json();

  document.getElementById("n-invoice-hidden").text = invoice;

  const svg = await qrCode(invoice, {
    type: "svg",
  });

  qrCodeContainer.innerHTML = svg;

  document.getElementById("n-modal-step-1").style.display = "none";
  document.getElementById("n-modal-step-2").style.display = "flex";

  const zapReceiptEvent = await fetchOneEvent({
    relayFactory,
    log,
    filter: {
      authors: [recipient],
      kinds: [9735],
      "#p": [metadataEvent.pubkey],
      "#e": [randomEventIndex],
      limit: 1,
    },
  });

  log("zapReceiptEvent", zapReceiptEvent);

  paidMessagePlaceholder.textContent = `⚡ You just zapped ${user} ${sats} sats ⚡`;

  document.getElementById("n-modal-step-2").style.display = "none";
  document.getElementById("n-modal-step-3").style.display = "flex";
}
