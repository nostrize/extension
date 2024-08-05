const path = require("path");

module.exports = {
  mode: "development",
  devtool: "source-map",
  entry: {
    "nostrize-background": "./src/service-workers/background.js",
    "github-issue": "./src/github/issue/issue.js",
    "github-issues": "./src/github/issues/issues.js",
    "github-profile": "./src/github/profile/profile.js",
    "youtube-channel": "./src/youtube/channel/channel.js",
    "youtube-shorts": "./src/youtube/shorts/shorts.js",
    "youtube-watch": "./src/youtube/watch/watch.js",
    "twitter-profile": "./src/twitter/profile/profile.js",
    popup: "./src/settings/popup.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  module: {},
};
