#!/bin/bash

npm pack ../packages/landing
npm pack ../packages/server

GIT_VERSION=$(git describe --tags --always --match 'v*')

docker build . -t ghcr.io/linz/basemaps:${GIT_VERSION}
docker tag ghcr.io/linz/basemaps:${GIT_VERSION} ghcr.io/linz/basemaps:latest