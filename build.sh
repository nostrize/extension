#!/bin/bash

rm -rf dist
mkdir dist

cp manifest.json dist/manifest.json

./node_modules/.bin/webpack

# copy github specific extension files
cp src/github/content/issues/issues.css dist/
cp src/github/content/issue/issue.css dist/
cp src/github/content/profile/profile.css dist/
cp src/github/content/profile/modal.css dist/

# settings popup
cp src/settings/popup.html dist/
cp src/settings/popup.css dist/
