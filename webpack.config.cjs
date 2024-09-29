const path = require("path");

module.exports = {
  mode: "development",
  devtool: "source-map",
  entry: {
    "nostrize-background": "./src/service-workers/background.js",
    "github-issue": "./src/github/issue/issue.js",
    "github-issues": "./src/github/issues/issues.js",
    "github-profile": "./src/github/profile/profile.js",
    "github-boost": "./src/github/feed/boost.js",
    "youtube-channel": "./src/youtube/channel/channel.js",
    "youtube-shorts": "./src/youtube/shorts/shorts.js",
    "youtube-watch": "./src/youtube/watch/watch.js",
    "twitter-profile": "./src/twitter/profile/profile.js",
    "telegram-web-bio": "./src/telegram-web/bio.js",
    "nostrize-nip07-provider": "./src/components/nip07-provider.js",
    "nostrize-settings": "./src/settings/settings.js",
    "nostrize-nip07-manager": "./src/nostrize-website/nip07-manager.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.svelte$/,
        use: {
          loader: "svelte-loader",
          options: {
            preprocess: require("svelte-preprocess")(),
            emitCss: true,
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".mjs", ".js", ".svelte", ".ts"],
    mainFields: ["svelte", "browser", "module", "main"],
  },
};
