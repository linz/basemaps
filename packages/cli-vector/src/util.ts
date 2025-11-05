import { existsSync, mkdirSync } from 'node:fs';

import { Epsg } from '@basemaps/geo';
import { createReadStream, ReadStream } from 'fs';

export const projection = Epsg.Wgs84.toEpsgString();

export const ContentType = {
  gpkg: 'application/x-ogc-gpkg',
  shp: 'application/x-ogc-shp',
  geojson: 'application/geo+json',
} as const;

export function createReadStreamSafe(filename: string): Promise<ReadStream> {
  return new Promise((resolve, reject) => {
    const fileStream = createReadStream(filename);
    fileStream.on('error', reject).on('open', () => {
      resolve(fileStream);
    });
  });
}

export interface TmpPaths {
  /**
   * @example "local-cache/layerId/{layerId}_{version}_{hash}.json"
   * @example "s3://linz-lds-cache/layerId/{layerId}_{version}_{hash}.json"
   */
  origin: URL;

  source: {
    /** @example "tmp/create/layers/schema/50248/50248.gpkg" */
    path: URL;

    /** @example "gpkg" */
    format: keyof typeof ContentType;

    /** @example "application/x-ogc-gpkg" */
    contentType: (typeof ContentType)[keyof typeof ContentType];
  };

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
  format: keyof typeof ContentType,
  shortbreadLayer: string,
): TmpPaths {
  /** @example "tmp/create/layers/50248/" */
  const LayersDir = new URL(`layers/${shortbreadLayer}/${layerId}/`, tmpPath);
  if (!existsSync(LayersDir)) {
    mkdirSync(LayersDir, { recursive: true });
  }

  /** @example "tmp/create/transform/aerialways/50248/" */
  const TransformDir = new URL(`transform/${shortbreadLayer}/${layerId}/`, tmpPath);
  if (!existsSync(TransformDir)) {
    mkdirSync(TransformDir, { recursive: true });
  }

  const tmpPaths = {
    origin: path,
    source: {
      path: new URL(`${layerId}.${format}`, LayersDir),
      format,
      contentType: ContentType[format],
    },
    ndjson: new URL(`${layerId}.ndjson`, LayersDir),
    genNdjson: new URL(`${layerId}-gen.ndjson`, TransformDir),
    mbtiles: new URL(`${layerId}.mbtiles`, TransformDir),
    mbtilesCopy: new URL(path.href.replace(/\.json$/, '.mbtiles')),
  };

  return tmpPaths;
}
