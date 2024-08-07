import { getLocalSettings } from "../helpers/local-cache.js";

async function settingsPage() {
  const state = await getLocalSettings();

  // Event listeners to update state
  document.getElementById("log").addEventListener("change", (e) => {
    state.debug.log = e.target.checked;

    console.log(state);
  });

  document.getElementById("namespace").addEventListener("input", (e) => {
    state.debug.namespace = e.target.value;

    console.log(state);
  });

  document.getElementById("mode").addEventListener("change", (e) => {
    state.nostrSettings.mode = e.target.value;

    document.getElementById("import-nip07").style.display =
      e.target.value === "nip07" ? "block" : "none";

    console.log(state);
  });

  function updateRelays() {
    console.log(state);

    const relaysList = document.getElementById("relays-list");
    relaysList.innerHTML = "";

    state.nostrSettings.relays.forEach((relay, index) => {
      const relayItem = document.createElement("li");
      relayItem.className = "relay-item";
      relayItem.innerHTML = `
      <input type="text" value="${relay}" />
      <button class="remove-relay" data-index="${index}">Remove</button>
    `;
      relaysList.appendChild(relayItem);
    });

    document.querySelectorAll(".remove-relay").forEach((button) => {
      button.addEventListener("click", (e) => {
        const index = e.target.getAttribute("data-index");
        state.nostrSettings.relays.splice(index, 1);
        updateRelays();
      });
    });

    document.querySelectorAll(".relay-item input").forEach((input, index) => {
      input.addEventListener("input", (e) => {
        state.nostrSettings.relays[index] = e.target.value;
      });
    });
  }

  document.getElementById("add-relay").addEventListener("click", () => {
    state.nostrSettings.relays.push("");

    updateRelays();
  });

  updateRelays();

  document.getElementById("import-nip07").addEventListener("click", () => {
    // TODO: Add your "Import from NIP07" action here
  });
}

settingsPage().catch(console.log);
