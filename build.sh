#!/bin/bash

rm -rf dist
mkdir dist

cp manifest.json dist/manifest.json

./node_modules/.bin/webpack

# copy component specific files
cp src/components/zap-modal.css dist/zap-modal.css

# copy github specific files
cp src/github/issues/issues.css dist/github-issues.css
cp src/github/issue/issue.css dist/github-issue.css
cp src/github/profile/profile.css dist/github-profile.css

# copy youtube specific files
cp src/youtube/channel/channel.css dist/youtube-channel.css
cp src/youtube/shorts/shorts.css dist/youtube-shorts.css
cp src/youtube/watch/watch.css dist/youtube-watch.css

# copy settings popup files
cp src/settings/popup.html dist/
cp src/settings/popup.css dist/
