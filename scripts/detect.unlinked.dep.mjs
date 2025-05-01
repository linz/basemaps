/**
 * Determine if a package is using another package without referencing it inside of the package.json
 */

import cp from 'child_process';
import { promises as fs } from 'fs';

const fileExists = async (path) => !!(await fs.stat(path).catch(() => false));

function getAllImports(path) {
  const allImports = new Set();

  const data = cp.execSync(`grep -R -E "from '@(basemaps|linzjs)" ${path}/src || true`).toString().split('\n');

  for (const line of data) {
    if (line.includes('require.resolve')) continue;
    if (line.includes('__test')) continue; // ignore tests
    const pkgName = line.split(' ').pop().replace(/[';]/g, '').trim();

    if (pkgName.length > 0) allImports.add(pkgName);
  }

  return allImports;
}

async function main() {
  const packages = await fs.readdir('./packages');

  // Set of all packages in this repository eg `@basemaps/geo` or `@linzjs/geojson`
  const localPackages = new Set(
    await Promise.all(packages.map(async (f) => JSON.parse(await fs.readFile(`./packages/${f}/package.json`)).name)),
  );

  console.log('Found local packages: ', localPackages);

  let hasFailures = false;
  for (const pkg of packages) {
    if (pkg === '__tests__') continue; // Ignore tests

    const pkgPath = `./packages/${pkg}`;
    const pkgJson = JSON.parse(await fs.readFile(`${pkgPath}/package.json`));

    const hasSource = await fileExists(`${pkgPath}/src`);
    if (!hasSource) continue;

    const allDeps = Object.keys(pkgJson.dependencies || {}).concat(Object.keys(pkgJson.devDependencies || {}));

    const localDeps = new Set(allDeps.filter((packageName) => localPackages.has(packageName)));
    const allImports = getAllImports(pkgPath);
    // console.log(pkg, allImports);

    for (const importedPackage of allImports) {
      // If the package is external ignore
      if (!localPackages.has(importedPackage)) continue;
      // Package is missing from the package.json
      if (!localDeps.has(importedPackage)) {
        if (importedPackage.includes('/build/')) continue;
        if (importedPackage.includes('@basemaps/test')) continue;
        console.error(`${pkg}: Missing import "${importedPackage}"`);
        hasFailures = true;
      }
    }
  }
  if (hasFailures) {
    process.exit(1);
  }
}

main().catch(console.error);
