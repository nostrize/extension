import {
  Either,
  generateRandomHexString,
  satsToMilliSats,
} from "../../../helpers/utils.js";

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

export async function fetchNpubFromNip05({ user, log }) {
  const fetchUrl = `https://${user}.github.io/github-connect/.well-known/nostr.json?user=${user}`;

  let response;

  try {
    response = await fetch(fetchUrl);
  } catch (error) {
    log("nip05 fetch error", error);

    return;
  }

  if (!response.ok) {
    log(response.status);

    return;
  }

  const json = await response.json();
  const npub = json["names"][user];

  log("npub", npub);

  return npub;
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
  relayUrl,
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
    relays: [relayUrl],
  });

  // can't access to window.nostr inside the content script, need to use events
  // for now fall back to anon zaps
  // actually no use the private key directly from .env for now
  // TODO: get it from window.nostr or from settings
  const zapRequestEvent = window.nostr
    ? await window.nostr.signEvent(eventTemplate)
    : finalizeEvent(eventTemplate, process.env.npriv);

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
    filter: {
      authors: [recipient],
      kinds: [9735],
      since: eventTemplate.created_at - 10 * 1000,
      "#p": [zapRequestEvent.pubkey],
      "#e": [randomEventIndex],
      limit: 1,
    },
  });

  log("zapReceiptEvent", zapReceiptEvent);

  paidMessagePlaceholder.textContent = `⚡ You just zapped ${user} ${sats} sats ⚡`;

  document.getElementById("n-modal-step-2").style.display = "none";
  document.getElementById("n-modal-step-3").style.display = "flex";
}
