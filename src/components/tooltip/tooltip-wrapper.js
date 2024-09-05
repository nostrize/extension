import * as html from "../../imgui-dom/html.js";

export function wrapInputTooltip({ id, input, tooltipText }) {
  input.classList.add("n-tooltip-wrapper-input");

  return html.div({
    id,
    classList: "n-tooltip-wrapper",
    children: [
      input,
      html.span({
        classList: "n-tooltip-text",
        text: tooltipText,
      }),
    ],
  });
}
