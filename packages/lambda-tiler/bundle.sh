#!/bin/bash
#
# Create a deployment bundle with sharp/libvips prebuilt included
#
../../scripts/bundle.js package.json
cd dist
../scripts/create.deployment.package.js
# Make the new package a commonjs module
cp -r ../static .
# @see https://sharp.pixelplumbing.com/en/stable/install/#aws-lambda
npm install --arch=x64 --platform=linux --production
