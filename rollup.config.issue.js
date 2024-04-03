import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: {
    background: "src/background.js",
    issue: "src/github/content/issue/issue.js",
  },
  output: {
    dir: "dist", // Outputs will be saved in the dist directory
    entryFileNames: "[name].js", // Name output files after their entry names
  },
  plugins: [resolve(), commonjs()],
};
