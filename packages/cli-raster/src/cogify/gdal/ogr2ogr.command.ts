import { TileMatrixSet } from '@basemaps/geo';
import { urlToString } from '@basemaps/shared';

import { GdalCommand } from './gdal.runner.js';

/**
 * Wrap a cutline to multipolygon if that is crossing Prime Meridian
 *
 * This is specific configuration to LINZ's charts mapsheets
 */
export function wrapCutline(target: URL, source: URL): GdalCommand {
  return {
    output: target,
    command: 'ogr2ogr',
    args: [['-f', 'GeoJSON', '-wrapdateline', '-nlt', 'MULTIPOLYGON', urlToString(target), urlToString(source)]]
      .filter((f) => f != null)
      .flat()
      .map(String),
  };
}

/**
 * Reproject a cutline to a specific tile matrix, so we can buffer it
 *
 * This is specific configuration to LINZ's charts mapsheets
 */
export function reprojectCutline(target: URL, source: URL, tileMatrix: TileMatrixSet): GdalCommand {
  return {
    output: target,
    command: 'ogr2ogr',
    args: [[urlToString(target), urlToString(source), '-wrapdateline', '-t_srs', tileMatrix.projection.toEpsgString()]]
      .filter((f) => f != null)
      .flat()
      .map(String),
  };
}

/**
 * Buffer a cutline to remove the edge artifacts
 *
 * This is specific configuration to LINZ's charts mapsheets
 */
export function bufferCutline(target: URL, source: URL, chartCode: string, resolution: number): GdalCommand {
  const trimPixel = 10; // Trim 10 pixels from each edge
  const trimMeters = trimPixel * resolution; // Convert pixels to meters
  return {
    output: target,
    command: 'ogr2ogr',
    args: [
      [
        urlToString(target),
        urlToString(source),
        '-dialect',
        'sqlite',
        '-sql',
        `SELECT ST_Buffer(geometry, -${trimMeters}) FROM '${chartCode}'`,
      ],
    ]
      .filter((f) => f != null)
      .flat()
      .map(String),
  };
}
