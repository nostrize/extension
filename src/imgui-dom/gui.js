export function prepend(parent, ...elements) {
  const existingElements = [...parent.childNodes];

  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }

  [...elements, ...existingElements].forEach((e) => parent.append(e));
}

export function gebid(id) {
  return document.getElementById(id);
}

export function insertBefore(newNode, existingNode) {
  existingNode.insertAdjacentElement("beforebegin", newNode);
}

export function insertAfter(newNode, existingNode) {
  existingNode.insertAdjacentElement("afterend", newNode);
}

export function reset({ app, state, log }) {
  log("reset is called");

  state.isResetting = true;

  let clonedApp = app.cloneNode();

  app.parentNode.replaceChild(clonedApp, app);

  state.isResetting = false;
  state.htmlElementOrderId = 0;
}

export function refocus({ app, state, log }) {
  if (state.focusedElementId) {
    log("refocus to", state.focusedElementId);

    app.querySelector(`#${state.focusedElementId}`).focus();
  }
}

export function getInputId({ appId, state }) {
  if (!state.htmlElementOrderId) {
    state.htmlElementOrderId = 0;
  }

  state.htmlElementOrderId++;

  return "__" + appId + "_" + state.htmlElementOrderId;
}

export function focusBlurListeners({ state, log }) {
  document.addEventListener(
    "focus",
    function (event) {
      if (!state.isResetting) {
        log("focused element", event.target);

        state.focusedElementId = event.target.id;
      }
    },
    true,
  );

  document.addEventListener(
    "blur",
    function (event) {
      if (!state.isResetting) {
        log("blur element", event.target);

        state.focusedElementId = null;
      }
    },
    true,
  );
}
