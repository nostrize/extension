#!/bin/bash

rm -rf dist
mkdir dist

cp manifest.json dist/manifest.json
cp src/logo.png dist/logo.png
cp src/settings/user-icon.svg dist/user-icon.svg
cp src/settings/edit-icon.svg dist/edit-icon.svg
cp src/settings/delete-icon.svg dist/delete-icon.svg
cp src/settings/open-link.svg dist/open-link.svg
cp src/settings/logout-icon.svg dist/logout-icon.svg
cp src/settings/verified.svg dist/verified.svg
cp src/settings/not-verified.svg dist/not-verified.svg

./node_modules/.bin/webpack

# TODO: prefix files with nostrize-

# copy component specific files
cp src/components/zap-modal.css dist/zap-modal.css
cp src/components/lightsats/lightsats-modal.css dist/lightsats-modal.css
cp src/components/tooltip/tooltip.css dist/nostrize-tooltip.css
cp src/components/checkbox/checkbox.css dist/nostrize-checkbox.css

# copy github specific files
cp src/github/issues/issues.css dist/github-issues.css
cp src/github/issue/issue.css dist/github-issue.css
cp src/github/profile/profile.css dist/github-profile.css
cp src/github/feed/boost.css dist/github-boost.css

# copy youtube specific files
cp src/youtube/channel/channel.css dist/youtube-channel.css
cp src/youtube/shorts/shorts.css dist/youtube-shorts.css
cp src/youtube/watch/watch.css dist/youtube-watch.css

# copy twitter specific files
cp src/twitter/profile/profile.css dist/twitter-profile.css
cp src/twitter/profile/notes.css dist/twitter-notes.css

# copy telegram web specific files
cp src/telegram-web/bio.css dist/telegram-web-bio.css

# copy settings popup files
cp src/settings/settings.html dist/nostrize-settings.html
