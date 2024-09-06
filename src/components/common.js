export function setupModal(modal, closeModalFn) {
  document.body.append(modal);

  modal.style.display = "block";

  // Center the modal after appending it to the body
  centerModal(modal);

  // Recenter the modal on window resize
  window.addEventListener("resize", () => centerModal(modal));

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function (event) {
    if (event.target == modal) {
      closeModalFn();
    }
  };

  // Listen for keydown events to close the modal when ESC is pressed
  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape" || event.key === "Esc") {
      closeModalFn();
    }
  });
}

export function centerModal(modal) {
  const modalContent = modal.querySelector(".n-modal-content");
  const windowHeight = window.innerHeight;
  const modalHeight = modalContent.offsetHeight;

  if (modalHeight < windowHeight) {
    modalContent.style.marginTop = `${(windowHeight - modalHeight) / 2}px`;
  } else {
    modalContent.style.marginTop = "20px";
    modalContent.style.marginBottom = "20px";
  }
}
