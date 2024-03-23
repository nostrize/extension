#!/bin/bash

rm -rf dist
mkdir dist

# copy extension files
cp background.js dist/background.js
cp manifest.json dist/manifest.json

# copy github specific extension files
mkdir -p dist/github/content
./node_modules/.bin/rollup github/content/issues.js --file dist/github/content/issues.js