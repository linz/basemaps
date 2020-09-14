#!/bin/bash
#
# Version bump the repo and create a branch ready for pull request
# 
set -e

git checkout master
git pull --rebase

# Validate that there are actually changes to be made, this will fail if nothing needs publishing
npx lerna changed -a

npx lerna version --conventional-commits --no-push -m 'release: %s' 

CURRENT_VERSION=$(node -p "require('./lerna.json').version")
git checkout -b release/v${CURRENT_VERSION}

# This tag will be created once the pull request is merged
git tag -d v${CURRENT_VERSION}
