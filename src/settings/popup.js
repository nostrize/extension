import * as gui from "../imgui-dom/gui.js";

document.addEventListener("DOMContentLoaded", () => {
  const accSections = document.querySelectorAll(".accordion-section-title");

  accSections.forEach((section) => {
    section.addEventListener("click", (e) => {
      e.preventDefault();

      const currentAttrValue = section.getAttribute("href");

      if (section.classList.contains("active")) {
        section.classList.remove("active");
        document.querySelector(currentAttrValue).style.display = "none";
      } else {
        accSections.forEach((item) => {
          item.classList.remove("active");
          document.querySelector(item.getAttribute("href")).style.display =
            "none";
        });

        section.classList.add("active");
        document.querySelector(currentAttrValue).style.display = "block";
      }
    });
  });

  const anonymousCheckbox = document.getElementById("anonymous-keys");
  const encryptKeysOptions = document.getElementById("encrypt-keys-options");

  anonymousCheckbox.addEventListener("change", () => {
    if (anonymousCheckbox.checked) {
      encryptKeysOptions.style.display = "none";
    } else {
      encryptKeysOptions.style.display = "block";
    }
  });

  const generatedKeysButton = gui.gebid("generate-encrypted-keys");
  const passphraseInput = gui.gebid("encryption-password");

  generatedKeysButton.addEventListener("click", () => {
    const passphrase = passphraseInput.value;

    console.log("generatedKeysButton click");

    chrome.runtime.sendMessage(
      { action: "generateKey", params: { passphrase } },
      (response) => {
        console.log(response);
      },
    );
  });
});
