export function customElement({ tagName, attributes = [] }) {
  const customElement = document.createElement(tagName);

  attributes.forEach(([key, value]) => {
    customElement[key] = value;
  });

  return customElement;
}

export async function asyncScript({
  src,
  id,
  type = "text/javascript",
  callback,
}) {
  const script = document.createElement("script");
  script.setAttribute("src", src);

  script.async = false;
  script.setAttribute("type", type);

  if (id) {
    script.id = id;
  }

  return new Promise((resolve, reject) => {
    script.onload = async () => {
      try {
        const res = await callback();

        resolve(res);
      } catch (error) {
        reject(error);
      }
    };

    script.onerror = (error) => {
      reject(new Error(`Failed to load script: ${src}. ${error}`));
    };

    document.head.appendChild(script);
  });
}

export function script({ text, src, id, type = "text/javascript" }) {
  const script = document.createElement("script");

  if (text) {
    script.textContent = text;
  }

  if (src) {
    script.setAttribute("src", src);
  }

  if (id) {
    script.id = id;
  }

  script.setAttribute("type", type);

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
  inputEventHandler,
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

  if (inputEventHandler) {
    inputElement.addEventListener("input", inputEventHandler);
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

export function link({
  classList,
  id,
  href,
  text,
  onclick,
  style = [],
  data = [],
}) {
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

  style.forEach(([key, value]) => (linkElement.style[key] = value));

  data.forEach(
    ([key, value]) => (linkElement.attributes[`data-${key}`] = value),
  );

  linkElement.setAttribute("href", href);
  linkElement.textContent = text;

  return linkElement;
}

const createContainerElement =
  (name) =>
  ({ classList, children = [], style = [], id, text } = {}) => {
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
export const label = createContainerElement("label");

const createTextElement =
  (name) =>
  ({
    text,
    innerHTML,
    eventTuples = [],
    styles = [],
    classList,
    onclick,
    id,
  }) => {
    const element = document.createElement(name);

    eventTuples.forEach(([eventName, event]) =>
      element.addEventListener(eventName, event),
    );

    styles.forEach(([key, value]) => (element.style[key] = value));

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

    if (innerHTML) {
      element.innerHTML = innerHTML;
    }

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
