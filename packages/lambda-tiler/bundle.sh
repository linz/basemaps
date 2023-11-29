#!/bin/bash
#
# Create a deployment bundle with sharp/libvips prebuilt included
#
../../scripts/bundle.mjs package.json
cd dist
../scripts/create.deployment.package.mjs
# Make the new package a commonjs module
cp -r ../static .
# @see https://sharp.pixelplumbing.com/en/stable/install/#aws-lambda
npm install --arch=arm64 --platform=linux --production
