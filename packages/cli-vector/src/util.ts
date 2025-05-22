import { existsSync, mkdirSync } from 'node:fs';

import { Epsg } from '@basemaps/geo';
import { createReadStream, promises as fs, ReadStream } from 'fs';

export const projection = Epsg.Wgs84.toEpsgString();

/**
 * Asynchronously touch the file by path and return true if file exists
 */
export async function fileExist(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch (ENOENT) {
    return false;
  }
}

export function createReadStreamSafe(filename: string): Promise<ReadStream> {
  return new Promise((resolve, reject) => {
    const fileStream = createReadStream(filename);
    fileStream.on('error', reject).on('open', () => {
      resolve(fileStream);
    });
  });
}

interface TmpPaths {
  /** @example "tmp/create/layers/50248/50248.gpkg" */
  source: URL;

  /** @example "tmp/create/layers/50248/50248.ndjson" */
  ndjson: URL;

  /** @example "tmp/create/transform/aerialways/50248/50248-gen.ndjson" */
  genNdjson: URL;

  /** @example "tmp/create/transform/aerialways/50248/50248.mbtiles" */
  mbtiles: URL;

  /**
   * @example "local-cache/layerId/{layerId}_{version}_{hash}.mbtiles"
   * @example "s3://linz-lds-cache/layerId/{layerId}_{version}_{hash}.mbtiles"
   */
  mbtilesCopy: URL;
}

export function prepareTmpPaths(
  tmpPath: URL,
  path: URL,
  layerId: string,
  format: string,
  shortbreadLayer: string,
): TmpPaths {
  /** @example "tmp/create/layers/50248/" */
  const LayersDir = new URL(`layers/${layerId}/`, tmpPath);
  if (!existsSync(LayersDir)) {
    mkdirSync(LayersDir, { recursive: true });
  }

  /** @example "tmp/create/transform/aerialways/50248/" */
  const TransformDir = new URL(`transform/${shortbreadLayer}/${layerId}/`, tmpPath);
  if (!existsSync(TransformDir)) {
    mkdirSync(TransformDir, { recursive: true });
  }

  return {
    source: new URL(`${layerId}.${format}`, LayersDir),
    ndjson: new URL(`${layerId}.ndjson`, LayersDir),
    genNdjson: new URL(`${layerId}-gen.ndjson`, TransformDir),
    mbtiles: new URL(`${layerId}.mbtiles`, TransformDir),
    mbtilesCopy: new URL(path.href.replace(/\.json$/, '.mbtiles')),
  };
}
