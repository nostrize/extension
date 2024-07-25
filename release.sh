# Fetch all tags
git fetch --tags

# Get the latest tag
LATEST_TAG=$(git describe --tags $(git rev-list --tags --max-count=1) 2>/dev/null || echo "")

# Debug output
echo "Latest tag: $LATEST_TAG"

# If there are no tags, start at v0.0.1
if [ -z "$LATEST_TAG" ]; then
  echo "Empty tag"
  NEW_TAG="v0.0.1"
else
  # Increment the version
  IFS='.' read -r -a PARTS <<< "${LATEST_TAG#v}"
  PATCH=${PARTS[2]}
  MINOR=${PARTS[1]}
  MAJOR=${PARTS[0]}
  
  PATCH=$((PATCH + 1))
  NEW_TAG="v$MAJOR.$MINOR.$PATCH"
fi

echo "New tag: $NEW_TAG"
echo "::set-output name=new_tag::$NEW_TAG"

zip -r release.zip . -i "dist/*.js" "dist/*.css" "dist/*.json"
gh release create "$NEW_TAG" ./release.zip -t "dev release"
