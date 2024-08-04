export function script({ text, src }) {
  const script = document.createElement("script");

  if (text) {
    script.textContent = text;
  }

  if (src) {
    script.setAttribute("src", src);
  }

  document.head.appendChild(script);
}

export function svg({ gId }) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  svg.setAttributeNS(
    "http://www.w3.org/2000/xmlns/",
    "xmlns:xlink",
    "http://www.w3.org/1999/xlink",
  );
  svg.innerHTML = `<g id="${gId}" />`;

  return svg;
}

export function input({
  type = "text",
  id,
  value,
  classList,
  min,
  max,
  placeholder,
  onchange,
}) {
  const inputElement = document.createElement("input");

  inputElement.type = type;

  if (id) {
    inputElement.id = id;
  }

  if (classList) {
    inputElement.classList = classList;
  }

  if (value) {
    inputElement.value = value;
  }

  if (onchange) {
    inputElement.onchange = onchange;
  }

  if (type === "number" && min) {
    inputElement.min = min;
  }

  if (type === "number" && max) {
    inputElement.max = max;
  }

  if (placeholder) {
    inputElement.placeholder = placeholder;
  }

  return inputElement;
}

export function hr({ classList }) {
  const hr = document.createElement("hr");

  if (classList) {
    hr.classList = classList;
  }

  return hr;
}

export function button({
  id,
  type = "button",
  classList,
  backgroundColor,
  color,
  text,
  attributes = [],
  onclick,
}) {
  const button = document.createElement("button");

  button.setAttribute("type", type);

  if (id) {
    button.id = id;
  }

  if (classList) {
    button.className = classList;
  }

  if (backgroundColor) {
    button.style.backgroundColor = backgroundColor;
  }

  if (color) {
    button.style.color = color;
  }

  if (onclick) {
    button.onclick = onclick;
  }

  attributes.forEach(([a, v]) => button.setAttribute(a, v));

  button.innerHTML = text;

  return button;
}

export function style({ text }) {
  const styleElement = document.createElement("style");
  const textElement = document.createTextNode(text);

  styleElement.appendChild(textElement);

  return styleElement;
}

export function link({ classList, id, href, text, onclick, style = [] }) {
  const linkElement = document.createElement("a");

  if (classList) {
    linkElement.className = classList;
  }

  if (onclick) {
    linkElement.onclick = onclick;
  }

  if (id) {
    linkElement.id = id;
  }

  style.forEach(([name, value]) => (linkElement.style[name] = value));

  linkElement.setAttribute("href", href);
  linkElement.textContent = text;

  return linkElement;
}

const createContainerElement =
  (name) =>
  ({ classList, children = [], style = [], id, text }) => {
    const containerDiv = document.createElement(name);

    if (classList) {
      containerDiv.classList = classList;
    }

    if (children) {
      children.forEach((element) => {
        containerDiv.appendChild(element);
      });
    }

    style.forEach(([name, value]) => (containerDiv.style[name] = value));

    if (id) {
      containerDiv.id = id;
    }

    if (text) {
      containerDiv.textContent = text;
    }

    return containerDiv;
  };

export const div = createContainerElement("div");
export const ul = createContainerElement("ul");
export const li = createContainerElement("li");

const createTextElement =
  (name) =>
  ({ text, eventTuples = [], classList, onclick, id }) => {
    const element = document.createElement(name);

    eventTuples.forEach(([eventName, event]) =>
      element.addEventListener(eventName, event),
    );

    if (id) {
      element.id = id;
    }

    if (classList) {
      element.classList = classList;
    }

    if (onclick) {
      element.onclick = onclick;
    }

    element.textContent = text;

    return element;
  };

export const p = createTextElement("p");
export const h1 = createTextElement("h1");
export const h2 = createTextElement("h2");
export const h3 = createTextElement("h3");
export const span = createTextElement("span");

export function labelFor({ input, classList, text }) {
  const label = document.createElement("label");

  if (classList) {
    label.classList = classList;
  }

  label.setAttribute("for", input.id);
  label.textContent = text;

  return [label, input];
}

export function buildApp({ appId, classList, children = [] }) {
  const appDiv = document.getElementById(appId);

  if (classList) {
    appDiv.classList = classList;
  }

  children.forEach((element) => {
    appDiv.appendChild(element);
  });

  return appDiv;
}
