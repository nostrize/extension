import { div } from "../../../imgui-dom/src/html.js";

export const createEmojiContainer = (children) =>
  div({
    classList: "n-emoji-container",
    children: [
      div({
        classList: "n-emoji",
        children,
      }),
    ],
  });
