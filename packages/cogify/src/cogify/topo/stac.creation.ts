import { Bounds, TileMatrixSet } from '@basemaps/geo';
import { fsa, LogType, Tiff } from '@basemaps/shared';
import { CliId, CliInfo } from '@basemaps/shared/build/cli/info.js';
import { GeoJSONPolygon } from 'stac-ts/src/types/geojson.js';

import { CogifyStacCollection, TopoStacItem } from '../stac.js';
import {
  extractBoundsFromTiff,
  extractEpsgFromTiff,
  extractMapCodeAndVersion,
  extractSizeFromTiff,
} from './extract.js';
import { brokenTiffs, ByDirectory, TiffItem } from './types.js';

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
      'source.width': tiffItem.size.width,
      'source.height': tiffItem.size.height,
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
    geometry: { type: 'Polygon', coordinates: tiffItem.bounds.toPolygon() } as GeoJSONPolygon,
    bbox: tiffItem.bounds.toBbox(),
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
  allStacItems.forEach((stacItem) => {
    stacItem.links.push({
      href: `./${latest.mapCode}_${latest.version}.json`,
      rel: 'latest-version',
      type: 'application/json',
    });
  });

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
  imageryBounds: Bounds,
  items: TopoStacItem[],
  logger?: LogType,
): CogifyStacCollection {
  logger?.info({ items: items.length }, 'CreateStacCollection()');
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
      spatial: { bbox: [imageryBounds.toBbox()] },
      // Default the temporal time today if no times were found as it is required for STAC
      temporal: { interval: [[CLI_DATE, null]] },
    },
    stac_extensions: ['https://stac-extensions.github.io/file/v2.0.0/schema.json'],
  };

  return collection;
}

/**
 * Groups a list of Tiff objects into a directory-like structure
 * based on each object's epsg, map code, and version information.
 *
 * This function assigns each tiff to a group based on its map code (e.g. "AT24").
 * For each group, it then identifies the latest version and sets a copy aside. *
 *
 * @param tiffs: the list of Tiff objects to group by epsg, and map code, and version
 * @returns a `ByDirectory<TiffItem>` promise
 */
export function groupTiffsByDirectory(tiffs: Tiff[], logger?: LogType): ByDirectory<TiffItem> {
  // group the tiffs by directory, epsg, and map code
  const byDirectory = new ByDirectory<TiffItem>();

  // create items for each tiff and store them into 'all' by {epsg} and {map code}
  for (const tiff of tiffs) {
    const source = tiff.source.url;
    const { mapCode, version } = extractMapCodeAndVersion(source.href, logger);

    const bounds = extractBoundsFromTiff(tiff);
    const epsg = extractEpsgFromTiff(tiff, logger);
    const size = extractSizeFromTiff(tiff, logger);

    if (bounds == null || epsg == null || size == null) {
      if (bounds == null) {
        brokenTiffs.noBounds.push(`${mapCode}_${version}`);
        logger?.warn({ mapCode, version }, 'Could not extract bounds from tiff');
      }

      if (epsg == null) {
        brokenTiffs.noEpsg.push(`${mapCode}_${version}`);
        logger?.warn({ mapCode, version }, 'Could not extract epsg from tiff');
      }

      if (size == null) {
        brokenTiffs.noSize.push(`${mapCode}_${version}`);
        logger?.warn({ mapCode, version }, 'Could not extract width or height from tiff');
      }

      continue;
    }

    const item = new TiffItem(tiff, source, mapCode, version, bounds, epsg, size);

    // push the item into 'all' by {epsg} and {map code}
    byDirectory.all.get(epsg.toString()).get(mapCode, []).push(item);
  }

  // for each {epsg} and {map code}, identify the latest item by {version} and copy it to 'latest'
  for (const [epsg, byMapCode] of byDirectory.all.entries()) {
    for (const [mapCode, items] of byMapCode.entries()) {
      const sortedItems = items.sort((a, b) => a.version.localeCompare(b.version));

      const latestItem = sortedItems[sortedItems.length - 1];
      if (latestItem == null) throw new Error();

      // store the item into 'latest' by {epsg} and {map code}
      byDirectory.latest.get(epsg).set(mapCode, latestItem);
    }
  }

  logger?.info(
    byDirectory.all.entries().reduce((obj, [epsg, byMapCode]) => {
      return { ...obj, [epsg]: byMapCode.entries().length };
    }, {}),
    'numItemsPerEpsg',
  );

  return byDirectory;
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
