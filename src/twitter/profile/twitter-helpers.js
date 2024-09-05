import * as gui from "../../imgui-dom/gui.js";

import { setupModal } from "../../components/common.js";

export const createTwitterButton = (buttonTobeCloned, accountName, options) => {
  const button = buttonTobeCloned.cloneNode(true);

  gui.insertAfter(button, buttonTobeCloned);

  button.id = options.id;
  button.href = "javascript:void(0)";
  button.childNodes[0].childNodes[0].remove();
  button.childNodes[0].childNodes[0].textContent = options.icon;
  button.setAttribute("data-for-account", accountName);

  button.addEventListener("mouseenter", () => {
    button.style.backgroundColor = "rgb(130, 80, 223)";
  });

  button.addEventListener("mouseleave", () => {
    button.style.backgroundColor = "black";
  });

  button.onclick = async () => {
    const { modal, closeModal } = await options.modalComponentFn();

    setupModal(modal, closeModal);
  };

  return button;
};
