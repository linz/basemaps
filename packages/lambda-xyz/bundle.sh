#!/bin/bash
#
# Create a deployment bundle with sharp/libvips prebuilt included
#
esbuild --bundle --platform=node src/index.ts --external:aws-sdk --external:pino-pretty --external:sharp --target=es2018 --outdir=dist --format=cjs
cd dist
cp ../package.json .
# @see https://sharp.pixelplumbing.com/en/stable/install/#aws-lambda
npm install --arch=x64 --platform=linux --target=10.15.0 sharp
