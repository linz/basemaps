#!/bin/bash
#
# Create a deployment bundle with sharp/libvips prebuilt included
#
../../scripts/bundle.js package.json
cd dist
# Make the new package a commonjs module
cat ../package.json | grep -v '"type": "module"' > package.json
cp -r ../static .
# @see https://sharp.pixelplumbing.com/en/stable/install/#aws-lambda
npm install --arch=x64 --platform=linux sharp
