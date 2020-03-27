/**
 * Determine if a package is using another package without referencing it inside of the package.json
 */

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
const fs = require('fs').promises;
const cp = require('child_process');

const fileExists = async path => !!(await fs.stat(path).catch(() => false));

function getAllImports(path) {
    const allImports = new Set();

    const data = cp
        .execSync(`grep -R "'@basemaps" ${path}/src || true`)
        .toString()
        .split('\n');

    for (const line of data) {
        const pkgName = line
            .split(' ')
            .pop()
            .replace(/[';]/g, '');

        if (pkgName.length > 0) allImports.add(pkgName);
    }

    return allImports;
}

async function main() {
    const packages = await fs.readdir('./packages');

    let hasFailures = false;
    for (const pkg of packages) {
        const pkgPath = `./packages/${pkg}`;
        const pkgJson = JSON.parse(await fs.readFile(`${pkgPath}/package.json`));

        const hasSource = await fileExists(`${pkgPath}/src`);
        if (!hasSource) continue;

        const allDeps = Object.keys(pkgJson.dependencies || {}).concat(Object.keys(pkgJson.devDependencies || {}));

        const localDeps = new Set(allDeps.filter(f => f.startsWith('@basemaps')));
        const allImports = getAllImports(pkgPath);

        for (const importedPackage of allImports) {
            if (!localDeps.has(importedPackage)) {
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
