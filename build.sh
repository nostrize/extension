#!/bin/bash

rm -rf dist
mkdir dist

cp manifest.json dist/manifest.json

# run rollup (check out rollup.config.js)
./node_modules/.bin/rollup -c rollup.config.issue.js
./node_modules/.bin/rollup -c rollup.config.issues.js

# copy github specific extension files
cp src/github/content/issues/issues.css dist/
cp src/github/content/issue/issue.css dist/
