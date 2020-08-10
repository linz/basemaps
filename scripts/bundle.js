#!/usr/bin/env node
/**
 * Using the package.json#bundle object configure ESBuild to bundle a javascript file
 */
const GitInfo = require('../packages/shared/build/cli/git.tag').GitTag;
const cp = require('child_process');
const fs = require('fs');
const z = require('zod');
const c = require('ansi-colors');
const path = require('path');

const gitInfo = GitInfo();
const DefaultEnvVars = {
    GIT_HASH: gitInfo.hash,
    GIT_VERSION: gitInfo.version,
    NODE_ENV: process.env.NODE_ENV || 'dev',
};

const BundleSchema = z.object({
    entry: z.string(),
    /** destination path */
    outdir: z.string(),

    env: z.array(z.string()).optional(),
    external: z.array(z.string()).optional(),

    /** Suffix a hash  */
    suffix: z.boolean().optional(),

    platform: z.literal('node').optional(),
    target: z.literal('es2018').optional(),

    format: z.literal('cjs').optional(),
});
const PkgBundle = z.union([BundleSchema, z.array(BundleSchema)]);

function defineEnv(envName, envValue) {
    const envVar = (envValue == null ? process.env[envName] : envValue) || '';
    envVar != '' ? console.log('DefineEnv', envName, `"${c.green(envVar)}"`) : null;
    return `--define:process.env.${envName}="${envVar}"`;
}

function joinPath(basePath, newPath) {
    if (newPath.startsWith('/')) return newPath;
    return path.join(basePath, newPath);
}

function bundleJs(basePath, cfg) {
    const outPath = joinPath(basePath, cfg.outdir);
    const buildCmd = [
        'esbuild',
        '--bundle',
        `--platform=${cfg.platform || 'node'}`,
        `--target=${cfg.target || 'es2018'}`,
        `--format=${cfg.format || 'cjs'}`,
        ...(cfg.env || []).map(defineEnv),
        ...Object.keys(DefaultEnvVars).map((c) => defineEnv(c, DefaultEnvVars[c])),
        ...(cfg.external || []).map((c) => `--external:${c}`),
        `--outdir=${outPath}`,
        joinPath(basePath, cfg.entry),
    ];

    cp.spawnSync('npx', buildCmd);

    const fileData = fs.readFileSync(path.join(outPath, 'index.js')).toString();
    console.log('Bundled', (fileData.length / 1024).toFixed(2), 'KB');
}

function usage(err) {
    if (err) console.log(err);
    console.log('Usage: ');
    console.log('./bundle.js [package.json]');
}

async function main() {
    const filePath = process.argv.slice(2).find((f) => f.endsWith('package.json'));
    if (filePath == null) return usage('No package.json found...');

    const basePath = path.resolve(path.dirname(filePath));
    const pkgData = await fs.promises.readFile(filePath);
    const pkgJson = JSON.parse(pkgData);
    if (pkgJson.bundle == null) return usage('No "bundle" found in package.json');
    PkgBundle.parse(pkgJson.bundle);
    const bundles = Array.isArray(pkgJson.bundle) ? pkgJson.bundle : [pkgJson.bundle];

    for (const bundle of bundles) await bundleJs(basePath, bundle);
}

main().catch(console.error);
