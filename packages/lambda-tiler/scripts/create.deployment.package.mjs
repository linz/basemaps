#!/usr/bin/env node
/**
 * Create a pacakge.json for the `dist` bundle based off the parent package.json
 *
 * This is needed as libsharp has to be "installed" into the dist node_modules so that lambda has access to sharp
 */
import * as fs from 'fs';

const parentPackage = JSON.parse(fs.readFileSync('../package.json').toString());

// Find the exact version of a package in the yarn lock
function getPackageVersion(packageName) {
  const parentLock = fs.readFileSync('../../../yarn.lock').toString().split('\n');

  for (let i = 0; i < parentLock.length; i++) {
    if (parentLock[i].startsWith(packageName + '@')) {
      const versionList = parentLock[i + 1].trim();
      if (!versionList.startsWith('version ')) throw new Error('Failed to find sharp version');
      return JSON.parse(versionList.slice('version '.length));
    }
  }
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
