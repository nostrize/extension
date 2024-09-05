import * as html from "../../imgui-dom/html.js";

export function wrapInputTooltip({ input, tooltipText }) {
  return html.div({
    classList: "tooltip-wrapper",
    children: [
      input,
      html.span({
        classList: "tooltip",
        text: tooltipText,
      }),
    ],
  });
}
