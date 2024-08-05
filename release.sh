#!/bin/bash

# Fetch all tags
git fetch --tags

# Fetch all tags, sort them numerically, and get the latest tag
LATEST_TAG=$(git tag | sort -V | tail -n 1)

# If no tags are found, set LATEST_TAG to an empty string
LATEST_TAG=${LATEST_TAG:-""}

echo "Latest tag: $LATEST_TAG"

# Further processing to determine the new tag, increment version, etc.

# If there are no tags, start at v0.0.1
if [ -z "$LATEST_TAG" ]; then
  echo "Empty tag"
  NEW_TAG="v0.0.1"
else
  # Increment the version
  IFS='.' read -r -a PARTS <<< "$(echo ${LATEST_TAG#v})"
  PATCH=${PARTS[2]}
  MINOR=${PARTS[1]}
  MAJOR=${PARTS[0]}
  
  PATCH=$((PATCH + 1))
  NEW_TAG="v$MAJOR.$MINOR.$PATCH"
fi

echo "New tag: $NEW_TAG"

# Create a zip file containing only js, css, and json files from the dist folder
zip -r release.zip . -i "dist/*.js" "dist/*.css" "dist/*.json"

# Create a new GitHub release
gh release create "$NEW_TAG" ./release.zip -t "dev release" -n "Automated release based on latest commit"
