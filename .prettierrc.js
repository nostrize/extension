export default {
  semi: true,
  singleQuote: false,
  doubleQuote: true,
  trailingComma: "all",
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  plugins: ["prettier-plugin-svelte"],
  overrides: [{ files: "*.svelte", options: { parser: "svelte" } }],
};
