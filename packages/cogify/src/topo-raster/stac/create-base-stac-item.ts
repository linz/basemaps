import { TileMatrixSet } from '@basemaps/geo';
import { LogType } from '@basemaps/shared';
import { CliId, CliInfo } from '@basemaps/shared/src/cli/info.js';
import { GeoJSONPolygon } from 'stac-ts/src/types/geojson.js';

import { MapSheetStacItem } from '../types/map-sheet-stac-item.js';
import { TiffItem } from '../types/tiff-item.js';

const CLI_DATE = new Date().toISOString();
const DEFAULT_TRIM_PIXEL_RIGHT = 1.7;

/**
 * This function creates a base StacItem object based on the provided parameters.
 *
 * @param fileName: The map sheet's filename
 * @example "CJ10" or "CJ10_v1-00"
 *
 * @param tiffItem TODO
 *
 * @returns a StacItem object
 */
export function createBaseStacItem(
  fileName: string,
  tiffItem: TiffItem,
  tileMatrix: TileMatrixSet,
  logger?: LogType,
): MapSheetStacItem {
  logger?.info({ fileName }, 'createBaseStacItem()');

  const item: MapSheetStacItem = {
    type: 'Feature',
    stac_version: '1.0.0',
    id: fileName,
    links: [
      { rel: 'self', href: `./${fileName}.json`, type: 'application/json' },
      { rel: 'collection', href: './collection.json', type: 'application/json' },
      { rel: 'parent', href: './collection.json', type: 'application/json' },
      { rel: 'linz_basemaps:source', href: tiffItem.source.href, type: 'image/tiff; application=geotiff' },
    ],
    assets: {
      source: {
        href: tiffItem.source.href,
        type: 'image/tiff; application=geotiff',
        roles: ['data'],
      },
    },
    stac_extensions: ['https://stac-extensions.github.io/file/v2.0.0/schema.json'],
    properties: {
      datetime: CLI_DATE,
      map_code: tiffItem.mapCode,
      version: tiffItem.version.replace('-', '.'), // e.g. "v1-00" to "v1.00"
      'proj:epsg': tiffItem.epsg.code,
      'source.width': tiffItem.size.width,
      'source.height': tiffItem.size.height,
      'linz_basemaps:options': {
        tileId: fileName,
        tileMatrix: tileMatrix.identifier,
        preset: 'webp',
        blockSize: 512,
        bigTIFF: 'no',
        compression: 'webp',
        quality: 100,
        overviewCompress: 'webp',
        overviewQuality: 90,
        overviewResampling: 'lanczos',
        sourceEpsg: tiffItem.epsg.code,
        addalpha: true,
        noReprojecting: true,
        srcwin: [0, 0, tiffItem.size.width - DEFAULT_TRIM_PIXEL_RIGHT, tiffItem.size.height],
      },
      'linz_basemaps:generated': {
        package: CliInfo.package,
        hash: CliInfo.hash,
        version: CliInfo.version,
        datetime: CLI_DATE,
      },
    },
    geometry: { type: 'Polygon', coordinates: tiffItem.bounds.toPolygon() } as GeoJSONPolygon,
    bbox: tiffItem.bounds.toBbox(),
    collection: CliId,
  };

  return item;
}
