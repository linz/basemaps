import mime from 'mime-types';
import { extname, basename, resolve } from 'path';
import { invalidateCache, uploadStaticFile } from '@basemaps/cli/build/cli/util.js';
import { fsa } from '@basemaps/shared';

const DistDir = './dist';

// match a string containing a version number
const HasVersionRe = /-\d+\.\d+\.\d+-/;

/**
 * Deploy the built s3 assets into the Edge bucket
 *
 * TODO there does not appear to be a easy way to do this with aws-cdk yet
 */
async function deploy() {
  const basePath = resolve(DistDir);
  for await (const filePath of fsa.list(basePath)) {
    const targetKey = filePath.slice(basePath.length);
    const isVersioned = HasVersionRe.test(basename(filePath));
    const contentType = mime.contentType(extname(filePath));

    const cacheControl = isVersioned
      ? // Set cache control for versioned files to immutable
        'public, max-age=604800, immutable'
      : // Set cache control for non versioned files to be short lived
        'public, max-age=60, stale-while-revalidate=300';

    if (targetKey.endsWith('index.html') && targetKey !== '/index.html') {
      await uploadStaticFile(filePath, targetKey.replace('/index.html', ''), contentType, cacheControl);
      await uploadStaticFile(filePath, targetKey.replace('/index.html', '/'), contentType, cacheControl);
    }

    const isUploaded = await uploadStaticFile(filePath, targetKey, contentType, cacheControl);
    if (isUploaded) {
      console.log('Uploaded', { targetKey });
      if (!isVersioned) await invalidateCache(targetKey, true);
    }
  }
}

deploy().catch(console.error);
