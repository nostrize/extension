import * as html from "../../imgui-dom/html.js";

export function wrapCheckbox({ input, onclick, text }) {
  return html.div({
    classList: "checkbox-container",
    children: [
      input,
      html.label({
        for: input.id,
        classList: input.checked
          ? "custom-checkbox checked"
          : "custom-checkbox",
        onclick: async (e) => {
          e.preventDefault();

          input.checked = !input.checked;

          // Update the custom checkbox appearance
          e.target.classList.toggle("checked", input.checked);

          if (onclick) {
            await onclick(input.checked);
          }
        },
      }),
      html.span({
        text,
        onclick: async (e) => {
          e.preventDefault();

          // Toggle the checkbox when the text is clicked
          input.checked = !input.checked;
          // Update the custom checkbox appearance
          e.target.previousElementSibling.classList.toggle(
            "checked",
            input.checked,
          );

          if (onclick) {
            await onclick(input.checked);
          }
        },
        style: [["cursor", "pointer"]],
      }),
    ],
  });
}
