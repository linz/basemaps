import mime from 'mime-types';
import { extname, basename, resolve, dirname } from 'path';
import { invalidateCache, uploadStaticFile } from '@basemaps/cli/build/cli/util.js';
import { fsa } from '@basemaps/shared';
import pLimit from 'p-limit';

const Q = pLimit(10);

const DistDir = './dist';

// match a string containing a version number
const HasVersionRe = /-\d+\.\d+\.\d+-/;

/**
 * Deploy the built s3 assets into the Edge bucket
 */
async function deploy() {
  const basePath = resolve(DistDir);

  const invalidationPaths = new Set();

  const fileList = await fsa.toArray(fsa.list(basePath));
  const promises = fileList.map((filePath) =>
    Q(async () => {
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
      if (!isUploaded) return; // No need to invalidate objects not uploaded
      console.log('FileUpload', targetKey, { isVersioned });
      if (isVersioned) return; // No need to invalidate versioned objects

      // Invalidate the top level directory only
      // or the base file if it exists
      if (targetKey.includes('/', 1)) {
        const dir = dirname(targetKey);
        invalidationPaths.add(dir + '/*');
      } else {
        invalidationPaths.add(targetKey);
      }
    }),
  );

  await Promise.all(promises);

  if (invalidationPaths.size > 0) {
    const toInvalidate = [...invalidationPaths];
    console.log('Invalidate', toInvalidate);
    await invalidateCache(toInvalidate, true);
  }
}

deploy().catch(console.error);
