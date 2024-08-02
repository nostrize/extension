const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "development",
  devtool: "source-map",
  entry: {
    background: "./src/service-workers/background.js",
    "github-issue": "./src/github/issue/issue.js",
    "github-issues": "./src/github/issues/issues.js",
    "github-profile": "./src/github/profile/profile.js",
    "youtube-channel": "./src/youtube/channel/channel.js",
    popup: "./src/settings/popup.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  resolve: {
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      buffer: require.resolve("buffer/"),
      stream: require.resolve("stream-browserify"),
      vm: require.resolve("vm-browserify"),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ],
  module: {},
};
