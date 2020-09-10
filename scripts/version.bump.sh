#!/bin/bash
#
# Version bump the repo and create a branch ready for pull request
# 
set -e

git checkout master
git pull --rebase

npx lerna changed -a
npx lerna version --conventional-commits --no-push -m 'release: %s' 

CURRENT_VERSION=$(node -p "require('./lerna.json').version")
git checkout -b release/v${CURRENT_VERSION}
git tag -d v${CURRENT_VERSION}
