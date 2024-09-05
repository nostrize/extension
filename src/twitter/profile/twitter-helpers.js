import { setupModal } from "../../components/common.js";

export const updateFollowButton = (button, emojiIcon) => {
  button.childNodes[0].childNodes[0].textContent = emojiIcon;
};

export const createTwitterButton = (buttonTobeCloned, accountName, options) => {
  const button = buttonTobeCloned.cloneNode(true);

  button.id = options.id;
  button.href = "javascript:void(0)";
  button.childNodes[0].childNodes[0].remove();
  button.childNodes[0].childNodes[0].textContent = options.emojiIcon;
  button.setAttribute("data-for-account", accountName);

  button.addEventListener("mouseenter", () => {
    button.style.backgroundColor = "rgb(130, 80, 223)";
  });

  button.addEventListener("mouseleave", () => {
    button.style.backgroundColor = "black";
  });

  button.onclick = async () => {
    const res = await options.modalComponentFn();

    if (!res) {
      return;
    }

    const { modal, closeModal } = res;

    setupModal(modal, closeModal);
  };

  return button;
};
