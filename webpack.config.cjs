const path = require("path");
const Dotenv = require("dotenv-webpack");

module.exports = {
  mode: "development",
  devtool: "source-map",
  entry: {
    background: "./src/background.js",
    issue: "./src/github/content/issue/issue.js",
    issues: "./src/github/content/issues/issues.js",
    profile: "./src/github/content/profile/profile.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  module: {},
  plugins: [new Dotenv()],
};
