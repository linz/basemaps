#!/bin/bash
#
# Attempt to create a new tag and release
#
CURRENT_VERSION=$(node -p "require('./lerna.json').version")
git tag v${CURRENT_VERSION}
git push --tags
