import { Bounds, Epsg, Projection } from '@basemaps/geo';
import { fsa, LogType } from '@basemaps/shared';
import { CliDate, CliId, CliInfo } from '@basemaps/shared/build/cli/info.js';
import { GeoJSONPolygon } from 'stac-ts/src/types/geojson.js';

import { CogifyLinkSource, CogifyStacCollection, TopoStacItem } from '../stac.js';
import { TiffItem } from './extract.js';

/**
 * Creates a StacItem with additional properties specific to topo-raster maps.
 *
 * @param fileName: The map sheet's filename.
 * @example "CJ10" or "CJ10_v1-00"
 *
 * @param tiffItem The TiffItem from which to create a TopoStacItem.
 *
 * @returns a TopoStacItem object.
 */
export function createBaseStacItem(fileName: string, tiffItem: TiffItem, logger?: LogType): TopoStacItem {
  logger?.info({ fileName }, 'createBaseStacItem()');

  const proj = Projection.get(tiffItem.epsg.code);
  const feature = proj.boundsToGeoJsonFeature(tiffItem.bounds);
  const bbox = proj.boundsToWgs84BoundingBox(tiffItem.bounds);

  const sourceLink: CogifyLinkSource = {
    rel: 'linz_basemaps:source',
    href: tiffItem.source.href,
    type: 'image/tiff; application=geotiff',
    'linz_basemaps:source_width': tiffItem.size.width,
    'linz_basemaps:source_height': tiffItem.size.height,
  };

  const item: TopoStacItem = {
    type: 'Feature',
    stac_version: '1.0.0',
    id: fileName,
    links: [
      { rel: 'self', href: `./${fileName}.json`, type: 'application/json' },
      { rel: 'collection', href: './collection.json', type: 'application/json' },
      { rel: 'parent', href: './collection.json', type: 'application/json' },
      sourceLink,
    ],
    assets: {},
    stac_extensions: ['https://stac-extensions.github.io/file/v2.0.0/schema.json'],
    properties: {
      datetime: CliDate,
      'linz:map_sheet': tiffItem.mapCode,
      version: tiffItem.version.replace('-', '.'), // e.g. "v1-00" to "v1.00"
      'proj:epsg': tiffItem.epsg.code,
      'linz_basemaps:options': {
        tileMatrix: tiffItem.tileMatrix.identifier,
        sourceEpsg: tiffItem.epsg.code,
      },
      'linz_basemaps:generated': {
        package: CliInfo.package,
        hash: CliInfo.hash,
        version: CliInfo.version,
        datetime: CliDate,
      },
    },
    geometry: feature.geometry as GeoJSONPolygon,
    bbox,
    collection: CliId,
  };

  return item;
}

/**
 * Creates StacItems from a list of TiffItems and a sublist of those identified as the latest versions by map code.
 *
 * @param scale: The scale of the imagery described by the TiffItems.
 * @example topo250
 *
 * @param resolution: The resolution of the imagery described by the TiffItems.
 * @example gridless_600dpi
 *
 * @param all: The list of TiffItems from which to create StacItems.
 *
 * @param latest: The sublist of TiffItems identifying the latest versions by map code, from which to also create StacItems.
 *
 * This function creates two directories:
 * - StacItems that will live in the "topo[50|250]" directory
 * - StacItems that will live in the "topo[50|250]_latest" directory
 *
 * All versions need a StacItem that will live in the topo[50/250] directory
 * The latest versions needs a second StacItem that will live in the topo[50|250]_latest directory
 *
 * @returns An object containing the StacItems that will live in the topo[50/250] directory (all), and those that will live in
 * the topo[50|250]_latest directory (latest).
 */
export function createStacItems(
  scale: string,
  resolution: string,
  all: TiffItem[],
  latest: Map<string, TiffItem>,
  logger?: LogType,
): { all: TopoStacItem[]; latest: TopoStacItem[] } {
  // create origin StacItem files
  const allStacItems = all.map((item) => {
    const latestTiff = latest.get(item.mapCode);
    if (latestTiff == null) throw new Error(`Failed to find latest item for map code '${item.mapCode}'`);

    const originStacItem = createBaseStacItem(`${item.mapCode}_${item.version}`, item, logger);

    // add link referencing the 'latest version' origin StacItem file that will live in the same directory
    originStacItem.links.push({
      href: `./${latestTiff.mapCode}_${latestTiff.version}.json`,
      rel: 'latest-version',
      type: 'application/json',
    });

    return originStacItem;
  });

  // create latest StacItem files
  const latestStacItems = Array.from(latest.values()).map((item) => {
    const latestStacItem = createBaseStacItem(item.mapCode, item, logger);

    // add link referencing this StacItem's origin file that will live in the topo[50/250] directory
    latestStacItem.links.push({
      // directory into which we save this StacItem file: <target>/<scale>_latest/<resolution>/<espg>/[latest_stac_item]
      // directory inside which we save this StacItem's origin file: <target>/<scale>/<resolution>/<espg>/[origin_stac_item]
      //
      // `../../../` takes us up to the <target> directory
      href: `../../../${scale}/${resolution}/${item.epsg.code}/${item.mapCode}_${item.version}.json`,
      rel: 'derived_from',
      type: 'application/json',
    });

    return latestStacItem;
  });

  return { latest: latestStacItems, all: allStacItems };
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
      temporal: { interval: [[CliDate, null]] },
    },
    stac_extensions: ['https://stac-extensions.github.io/file/v2.0.0/schema.json'],
  };

  return collection;
}

export async function writeStacFiles(
  target: URL,
  items: TopoStacItem[],
  collection: CogifyStacCollection,
  logger: LogType,
): Promise<{ items: URL[]; collection: URL }> {
  // Create collection json for all topo50-latest items.
  logger.info({ itemCount: items.length, collectionId: collection.id, target: target.href }, 'Stac:Output');

  const itemPaths: URL[] = [];

  for (const item of items) {
    const itemPath = new URL(`${item.id}.json`, target);
    itemPaths.push(itemPath);

    await fsa.write(itemPath, JSON.stringify(item, null, 2));
  }

  const collectionPath = new URL('collection.json', target);
  logger.info({ collectionId: collection.id, target: collectionPath.href }, 'Stac:Output:Collection');

  await fsa.write(collectionPath, JSON.stringify(collection, null, 2));

  return { items: itemPaths, collection: collectionPath };
}
