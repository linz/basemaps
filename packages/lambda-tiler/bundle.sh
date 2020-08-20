#!/bin/bash
#
# Create a deployment bundle with sharp/libvips prebuilt included
#
../../scripts/bundle.js package.json
cd dist
cp ../package.json .
# @see https://sharp.pixelplumbing.com/en/stable/install/#aws-lambda
npm install --arch=x64 --platform=linux sharp
