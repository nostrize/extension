import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: {
    issues: "src/github/content/issues/issues.js",
  },
  output: {
    dir: "dist", // Outputs will be saved in the dist directory
    entryFileNames: "[name].js", // Name output files after their entry names
  },
  plugins: [resolve(), commonjs()],
};
