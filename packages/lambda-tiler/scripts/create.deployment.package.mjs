#!/usr/bin/env node
/**
 * Create a package.json for the `dist` bundle based off the parent package.json
 *
 * This is needed as libsharp has to be "installed" into the dist node_modules so that lambda has access to sharp
 */
import * as fs from 'fs';

const parentPackage = JSON.parse(fs.readFileSync('../package.json').toString());

// Find the exact version of a package in the package-lock lock
export function getPackageVersion(packageName) {
  const parentLock = JSON.parse(fs.readFileSync('../../../package-lock.json').toString());
  return parentLock.packages['node_modules/' + packageName].version
}

// the bundle is a commonjs module
parentPackage.type = 'commonjs';
parentPackage.main = 'index.js';
parentPackage.dependencies = { sharp: getPackageVersion('sharp') };

// Clean up
delete parentPackage.types;
delete parentPackage.devDependencies;

console.log('Installing dependencies', parentPackage.dependencies);
fs.writeFileSync('./package.json', JSON.stringify(parentPackage, null, 2));
