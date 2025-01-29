import { Bounds, Epsg, Projection, TileMatrixSet } from '@basemaps/geo';
import { fsa, LogType } from '@basemaps/shared';
import { CliId, CliInfo } from '@basemaps/shared/build/cli/info.js';
import { GeoJSONPolygon } from 'stac-ts/src/types/geojson.js';

import { CogifyStacCollection, TopoStacItem } from '../stac.js';
import { TiffItem } from './types.js';

const CLI_DATE = new Date().toISOString();

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
): TopoStacItem {
  logger?.info({ fileName }, 'createBaseStacItem()');

  const proj = Projection.get(tiffItem.epsg.code);
  const feature = proj.boundsToGeoJsonFeature(tiffItem.bounds);
  const bbox = proj.boundsToWgs84BoundingBox(tiffItem.bounds);

  const item: TopoStacItem = {
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
      'source:width': tiffItem.size.width,
      'source:height': tiffItem.size.height,
      'linz_basemaps:options': {
        tileMatrix: tileMatrix.identifier,
        sourceEpsg: tiffItem.epsg.code,
      },
      'linz_basemaps:generated': {
        package: CliInfo.package,
        hash: CliInfo.hash,
        version: CliInfo.version,
        datetime: CLI_DATE,
      },
    },
    geometry: feature.geometry as GeoJSONPolygon,
    bbox,
    collection: CliId,
  };

  return item;
}

/**
 * This function needs to create two groups:
 * - StacItem objects that will live in the "topo[50|250]" directory
 * - StacItem objects that will live in the "topo[50|250]_latest" directory
 *
 * All versions need a StacItem object that will live in the topo[50/250] directory
 * The latest version needs a second StacItem object that will live in the topo[50|250]_latest directory
 */
export function createStacItems(
  scale: string,
  resolution: string,
  tileMatrix: TileMatrixSet,
  all: TiffItem[],
  latest: TiffItem,
  logger?: LogType,
): { all: TopoStacItem[]; latest: TopoStacItem } {
  const allStacItems = all.map((item) =>
    createBaseStacItem(`${item.mapCode}_${item.version}`, item, tileMatrix, logger),
  );

  // add link to all items pointing to the latest version
  for (const item of allStacItems) {
    item.links.push({
      href: `./${latest.mapCode}_${latest.version}.json`,
      rel: 'latest-version',
      type: 'application/json',
    });
  }

  const latestStacItem = createBaseStacItem(latest.mapCode, latest, tileMatrix);

  // add link to the latest item referencing its copy that will live in the topo[50/250] directory
  latestStacItem.links.push({
    // from: <target>/<scale>_latest/<resolution>/<espg>
    //       ../../../ = <target>
    // to:   <target>/<scale>/<resolution>/<espg>
    href: `../../../${scale}/${resolution}/${latest.epsg.code}/${latest.mapCode}_${latest.version}.json`,
    rel: 'derived_from',
    type: 'application/json',
  });

  return { latest: latestStacItem, all: allStacItems };
}

export function createStacCollection(
  title: string,
  linzSlug: string,
  epsgCode: Epsg,
  imageryBounds: Bounds,
  items: TopoStacItem[],
  logger?: LogType,
): CogifyStacCollection {
  logger?.info({ items: items.length }, 'CreateStacCollection()');

  const proj = Projection.get(epsgCode);
  const bbox = proj.boundsToWgs84BoundingBox(imageryBounds);

  const collection: CogifyStacCollection = {
    type: 'Collection',
    stac_version: '1.0.0',
    id: CliId,
    title,
    description: 'Topographic maps of New Zealand',
    license: 'CC-BY-4.0',
    links: [
      // TODO: We not have an ODR bucket for the linz-topographic yet.
      // {
      //   rel: 'root',
      //   href: 'https://nz-imagery.s3.ap-southeast-2.amazonaws.com/catalog.json',
      //   type: 'application/json',
      // },
      { rel: 'self', href: './collection.json', type: 'application/json' },
      ...items.map((item) => {
        return {
          href: `./${item.id}.json`,
          rel: 'item',
          type: 'application/json',
        };
      }),
    ],
    providers: [{ name: 'Land Information New Zealand', roles: ['host', 'licensor', 'processor', 'producer'] }],
    'linz:lifecycle': 'ongoing',
    'linz:geospatial_category': 'topographic-maps',
    'linz:region': 'new-zealand',
    'linz:security_classification': 'unclassified',
    'linz:slug': linzSlug,
    extent: {
      spatial: { bbox: [bbox] },
      // Default the temporal time today if no times were found as it is required for STAC
      temporal: { interval: [[CLI_DATE, null]] },
    },
    stac_extensions: ['https://stac-extensions.github.io/file/v2.0.0/schema.json'],
  };

  return collection;
}

export async function writeStacFiles(
  target: URL,
  items: TopoStacItem[],
  collection: CogifyStacCollection,
  logger?: LogType,
): Promise<{ itemPaths: { path: URL }[]; collectionPath: URL }> {
  // Create collection json for all topo50-latest items.
  logger?.info({ target }, 'CreateStac:Output');
  logger?.info({ items: items.length, collectionID: collection.id }, 'Stac:Output');

  const itemPaths = [];

  for (const item of items) {
    const itemPath = new URL(`${item.id}.json`, target);
    itemPaths.push({ path: itemPath });

    await fsa.write(itemPath, JSON.stringify(item, null, 2));
  }

  const collectionPath = new URL('collection.json', target);
  await fsa.write(collectionPath, JSON.stringify(collection, null, 2));

  return { itemPaths, collectionPath };
}
