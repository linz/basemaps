#!/usr/bin/env node
/**
 * This script bundles the source for distribtuions
 * * Javascript - Uses esbuild to bundle and minify
 * * HTML - find/replace
 */
const cp = require('child_process');
const crypto = require('crypto');
const pkg = require('../package.json');
const fs = require('fs').promises;
const c = require('ansi-colors');
const { recurseDirectory } = require('./util');

// Proxy environment vars into the build
const ENV_VARS = ['API_KEY', 'NODE_ENV', 'GOOGLE_ANALYTICS', 'TILE_HOST'].map((envName) => {
    const envVar = process.env[envName] || '';
    envVar != '' ? console.log('DefineEnv', envName, `"${c.green(envVar)}"`) : null;
    return `--define:process.env.${envName}="'${envVar}'"`;
});

const BUILD_CMD = [
    'npx',
    'esbuild',
    '--bundle',
    '--target=es2018',

    ...ENV_VARS,
    process.env.NODE_ENV == 'production' ? '--minify' : '',
    'src/index.ts',
];

const SPECIAL_FILES = {
    'index.css': true,
    'index.html': true,
    'index.js': true,
};

/**
 * List of CSS files to bundle
 * TODO it would be good to read these from the `index.html`
 */
const CSS_SOURCE = ['static/index.css', '../../node_modules/ol/ol.css', '../../node_modules/@linzjs/lui/dist/lui.css'];

/**
 * Display a number in KB with a few decimal places
 * @param {number} num
 * @returns {string}
 */
function toBytes(num) {
    return Math.floor((num / 1024) * 1e3) / 1e3 + 'KB';
}

/**
 * Create a suffix of the file using a sha512 hash and package.json version
 *
 * @param {string} fileData raw file
 * @returns {string} suffix for the file
 */
function fileSuffix(fileData) {
    if (process.env.NODE_ENV == null) {
        return '';
    }
    const bundleHash = crypto.createHash('sha512').update(fileData).digest('hex').slice(0, 16);
    return `-${pkg.version}-${bundleHash}`;
}

/**
 * Bundle a file and return a subresource integrity hash
 * @param {string} fileName name of file to output
 * @param {Buffer|string} fileData contents of file
 */
async function bundleFile(fileName, fileData) {
    await fs.writeFile(`dist/${fileName}`, fileData);
    console.log('Bundled', c.bold(`dist/${fileName}`), toBytes(fileData.length));

    const hash = crypto.createHash('sha512').update(fileData).digest('base64');
    return { name: fileName, hash: `sha512-${hash}` };
}

async function bundleJs() {
    console.log(c.bold('BundleArgs'), BUILD_CMD.filter(Boolean));
    const bundledCode = cp.execSync(BUILD_CMD.join(' ')).toString();
    return bundleFile(`index${fileSuffix(bundledCode)}.js`, bundledCode);
}

async function bundleCss() {
    const bundle = [];
    for (const cssFile of CSS_SOURCE) {
        console.log(cssFile);
        const cssData = await fs.readFile(cssFile);
        bundle.push(cssData.toString());
    }
    const bundledCode = bundle.join('');
    return bundleFile(`index${fileSuffix(bundledCode)}.css`, bundledCode);
}

async function bundleHtml(opts) {
    const js = opts.js;
    const css = opts.css;
    const html = await fs.readFile('./static/index.html');
    const htmlOutput = html
        .toString()
        .replace('$JS_FILE', `<script src="${js.name}" integrity="${js.hash}"></script>`)
        .replace('$CSS_FILE', `<link rel="stylesheet" href="${css.name}" integrity="${css.hash}" />`);

    await fs.writeFile('./dist/index.html', htmlOutput);
}

/**
 * Copy all non special files from the static directory to the dist directory including any sub
 * directories.
 */
async function copyStatic() {
    const srcDir = './static';
    await recurseDirectory(srcDir, async (filePath, isDir) => {
        if (SPECIAL_FILES[filePath]) return false;
        const srcPath = `${srcDir}/${filePath}`;
        const destPath = `./dist/${filePath}`;
        if (isDir) {
            await fs.mkdir(destPath, { recursive: true });
        } else {
            await fs.writeFile(destPath, await fs.readFile(srcPath));
        }
        return true;
    });
}

async function main() {
    await fs.mkdir('dist', { recursive: true });
    await copyStatic();

    const js = await bundleJs();
    const css = await bundleCss();
    await bundleHtml({ js, css });
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
