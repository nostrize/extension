#!/bin/bash

rm -rf dist
mkdir dist

cp manifest.json dist/manifest.json

./node_modules/.bin/webpack

# copy github specific extension files
cp src/github/issues/issues.css dist/github-issues.css
cp src/github/issue/issue.css dist/github-issue.css
cp src/github/profile/profile.css dist/github-profile.css
cp src/github/profile/modal.css dist/github-profile-modal.css

# copy youtube specific extension files
cp src/youtube/channel/channel.css dist/youtube-channel.css

# settings popup
cp src/settings/popup.html dist/
cp src/settings/popup.css dist/
