const path = require("path");

module.exports = {
  mode: "development",
  devtool: "source-map",
  entry: {
    background: "./src/background.js",
    issue: "./src/github/content/issue/issue.js",
    issues: "./src/github/content/issues/issues.js",
    profile: "./src/github/content/profile/profile.js",
    inject: "./src/github/content/inject.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  module: {},
};
