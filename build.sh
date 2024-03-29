#!/bin/bash

rm -rf dist
mkdir dist

cp manifest.json dist/manifest.json

# run rollup (check out rollup.config.js)
./node_modules/.bin/rollup -c

# copy github specific extension files
mkdir -p dist/github/content
cp src/github/content/issues.css dist/github/content/

# move rollup generated files to its own directory
mv dist/issues.js dist/github/content/issues.js