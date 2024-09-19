import { getLocalSettings } from "../helpers/local-cache.js";

import Settings from "./settings.svelte";

async function settingsPage() {
  const state = await getLocalSettings();

  const settingsContainer = document.getElementById("settings-container");

  new Settings({
    target: settingsContainer,
    props: { settings: state },
  });

  // Collapsable sections
  document.querySelectorAll(".section.collapsable").forEach((collapsable) => {
    const header = collapsable.querySelector("h2");

    header.addEventListener("click", () => {
      header.classList.toggle("collapsed");
      header.classList.toggle("expanded");

      const inputContainer = collapsable.querySelector(".input-container");
      inputContainer.classList.toggle("collapsed");
      inputContainer.classList.toggle("expanded");
    });
  });
}

settingsPage().catch(console.log);
