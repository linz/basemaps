import { promisify } from 'node:util';
import { gzip } from 'node:zlib';

import { sha256base58 } from '@basemaps/config';
import { fsa, LogType } from '@basemaps/shared';
import { FileInfo } from '@chunkd/fs';

import { ConfigImageryTiff } from './tiff.config.js';

export const ConfigCacheVersion = `V1`; // TODO this could just be the config packageJson ?

const gzipPromise = promisify(gzip);

/**
 * Create a config cache key based off the source files, location, size and last modified times
 *
 * @example
 * ```
 * YYYY-MM/proto_hostname/hashKey.json.gz
 * 2034-04/s3_linz-imagery/Ci4chK59behxsGZq6TaUde5DoVb7jTxhyaZ44j4wBnCb.json.gz
 * ```
 *
 * @param sourceFiles
 * @param cacheLocation
 *
 * @returns a unique config location
 */
function getCacheKey(sourceFiles: FileInfo[], cacheLocation: URL): URL {
  const configKey =
    ConfigCacheVersion + sourceFiles.map((m) => `${m.url.href}::${m.size}::${m.lastModified}`).join('\n');
  // create a config hash based on the YYYY-MM/proto_hostname/hashKey.json.gz

  const datePart = new Date().toISOString().slice(0, 7);
  const protoPart = cacheLocation.protocol.replace(':', ''); // convert file: into file
  const configKeyHash = [datePart, `${protoPart}_${sha256base58(configKey)}_.json.gz`].join('/');
  return new URL(configKeyHash, cacheLocation);
}

export async function getCachedImageryConfig(
  sourceFiles: FileInfo[],
  cacheLocation?: URL,
  log?: LogType,
): Promise<ConfigImageryTiff | null> {
  if (cacheLocation == null) return null;
  const cacheKey = getCacheKey(sourceFiles, cacheLocation);
  const previousVersion = await fsa.readJson<ConfigImageryTiff>(cacheKey).catch(() => null);

  if (previousVersion == null) return null;
  log?.info(
    { title: previousVersion.title, imageryName: previousVersion.name, files: previousVersion.files.length, cacheKey },
    'Tiff:Loaded:Cache',
  );
  return previousVersion;
}

export async function writeCachedImageryConfig(
  sourceFiles: FileInfo[],
  config: ConfigImageryTiff,
  cacheLocation?: URL,
): Promise<void> {
  if (cacheLocation == null) return;
  const cacheKey = getCacheKey(sourceFiles, cacheLocation);
  await fsa.write(cacheKey, await gzipPromise(JSON.stringify(config))).catch(() => null);
}
