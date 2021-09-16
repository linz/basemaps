#!/usr/bin/env node
/**
 * Using the package.json#bundle object configure ESBuild to bundle a javascript file
 */
import { GitTag } from '../packages/shared/build/cli/git.tag.js';
import crypto from 'crypto';
import cp from 'child_process';
import fs from 'fs';
import * as z from 'zod';
import c from 'ansi-colors';
import path from 'path';
import { recurseDirectory } from './file.util.js';
import { createRequire } from 'module';

const gitInfo = GitTag();
const DefaultEnvVars = {
    GIT_HASH: gitInfo.hash,
    GIT_VERSION: gitInfo.version,
    NODE_ENV: process.env.NODE_ENV || 'dev',
};

let pkgJson;

const require = createRequire(import.meta.url);

const BundleSchema = z.object({
    entry: z.string(),
    /** destination path */
    outdir: z.string().optional(),
    outfile: z.string().optional(),

    env: z.record(z.union([z.null(), z.string()])).optional(),
    external: z.array(z.string()).optional(),

    /** Suffix a hash  */
    suffix: z.boolean().optional(),
    /** Hash and copy resources and insert into them into an HTML template  */
    subresourceHash: z.record(z.string()).optional(),

    platform: z.union([z.literal('node'), z.literal('browser')]).optional(),
    target: z.literal('es2018').optional(),

    format: z.literal('cjs').optional(),
});
const PkgBundle = z.union([BundleSchema, z.array(BundleSchema)]);

function defineEnv([envName, envValue]) {
    const envVar = (envValue == null ? process.env[envName] : envValue) || '';
    if (envVar !== '') console.log('DefineEnv', envName, `"${c.green(envVar)}"`);
    return `--define:process.env.${envName}="${envVar}"`;
}

function joinPath(basePath, newPath) {
    if (newPath.startsWith('/')) return newPath;
    return path.join(basePath, newPath);
}

function fileSuffix(fileData) {
    const bundleHash = crypto.createHash('sha512').update(fileData).digest('hex').slice(0, 16);
    return `-${pkgJson.version}-${bundleHash}`;
}

function bundleJs(basePath, cfg, outfile) {
    const buildCmd = [
        'esbuild',
        '--bundle',
        `--platform=${cfg.platform || 'node'}`,
        `--target=${cfg.target || 'es2020'}`,
        `--format=${cfg.format || 'cjs'}`,
        ...Object.entries(cfg.env || {}).map(defineEnv),
        ...Object.entries(DefaultEnvVars).map(defineEnv),
        ...(cfg.external || []).map((c) => `--external:${c}`),
        `--outfile=${outfile}`,
        joinPath(basePath, cfg.entry),
    ];
    console.log(buildCmd);

    const res = cp.spawnSync('npx', buildCmd);
    if (res.status > 0) {
        console.log('BuildCommandFailed', buildCmd);
        console.log(res.stderr.toString().trim());
        process.exit(1);
    }

    const fileData = fs.readFileSync(outfile).toString();
    console.log('Bundled', (fileData.length / 1024).toFixed(2), 'KB');
}

async function bundleDir(basePath, cfg, outfile) {
    const srcDir = cfg.entry;
    fs.mkdirSync(outfile, { recursive: true });

    await recurseDirectory(srcDir, (filePath, isDir) => {
        const srcPath = path.join(srcDir, filePath);
        const destPath = path.join(outfile, filePath);
        if (isDir) {
            fs.mkdirSync(destPath, { recursive: true });
        } else {
            fs.writeFileSync(destPath, fs.readFileSync(srcPath));
        }
        return true;
    });
}

async function bundleFile(basePath, cfg, outFile) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, fs.readFileSync(cfg.entry));
}

const HtmlTemplateExtReplace = {
    '.js': (name, hash) => `<script src="${name}" integrity="sha512-${hash}"></script>`,
    '.css': (name, hash) => `<link rel="stylesheet" href="${name}" integrity="${hash}" />`,
};

function bundleHtml(basePath, cfg, outfile) {
    const outDir = path.dirname(outfile);
    const html = fs.readFileSync(joinPath(basePath, cfg.entry));
    let htmlOutput = html.toString();
    if (cfg.subresourceHash != null) {
        for (const [key, filename] of Object.entries(cfg.subresourceHash)) {
            const data = fs.readFileSync(joinPath(outDir, filename));
            const hash = crypto.createHash('sha512').update(data).digest('base64');
            const ext = path.extname(filename);
            const extReplace = HtmlTemplateExtReplace[ext];
            if (extReplace == null) {
                throw new Error('Unsupported HTML template subresource. ext: ' + ext);
            }
            const hashName = `${filename.slice(0, -ext.length)}${fileSuffix(data)}${ext}`;
            fs.writeFileSync(joinPath(outDir, hashName), data);

            htmlOutput = htmlOutput.replace(key, extReplace(hashName, hash));
        }
    }

    fs.writeFileSync(outfile, htmlOutput);
    console.log('Bundled', (htmlOutput.length / 1024).toFixed(2), 'KB');
}

function bundleCss(basePath, cfg, outfile) {
    const bundle = [];
    for (const cssFile of [cfg.entry].concat(cfg.external.map((f) => require.resolve(f)) || [])) {
        console.log(cssFile);
        const cssData = fs.readFileSync(cssFile);
        bundle.push(cssData.toString());
    }
    const fileData = bundle.join('');
    fs.mkdirSync(path.dirname(outfile), { recursive: true });
    fs.writeFileSync(outfile, fileData);

    console.log('Bundled', (fileData.length / 1024).toFixed(2), 'KB');
}

function usage(err) {
    if (err) console.log(err);
    console.log('Usage: ');
    console.log('./bundle.js [package.json]');
}

const Bundler = {
    directory: bundleDir,
    svg: bundleFile,
    ts: bundleJs,
    js: bundleJs,
    html: bundleHtml,
    css: bundleCss,
};

const DefaultSuffix = {
    directory: '',
    ts: '.js',
    js: '.js',
    html: '.html',
    css: '.css',
};

async function main() {
    const filePath = process.argv.slice(2).find((f) => f.endsWith('package.json'));
    if (filePath == null) return usage('No package.json found...');

    const basePath = path.resolve(path.dirname(filePath));
    const pkgData = await fs.promises.readFile(filePath);
    pkgJson = JSON.parse(pkgData);
    if (pkgJson.bundle == null) return usage('No "bundle" found in package.json');
    PkgBundle.parse(pkgJson.bundle);
    const bundles = Array.isArray(pkgJson.bundle) ? pkgJson.bundle : [pkgJson.bundle];

    for (const bundle of bundles) {
        const st = fs.statSync(joinPath(basePath, bundle.entry));
        const ext = path.extname(bundle.entry);
        const type = ext.slice(1) || (st.isDirectory() && 'directory');
        const func = Bundler[type];
        if (func == null) {
            throw new Error('Unsupported file type! ' + bundle.entry);
        }
        const outfile = joinPath(
            basePath,
            bundle.outfile || joinPath(bundle.outdir || 'dist', path.basename(bundle.entry, ext) + DefaultSuffix[type]),
        );
        await func(basePath, bundle, outfile);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
