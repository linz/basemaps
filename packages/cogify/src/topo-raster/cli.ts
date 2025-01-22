import { loadTiffsFromPaths } from '@basemaps/config-loader/build//json/tiff.config.js';
import { Bounds, Epsg, Nztm2000Tms, TileMatrixSets } from '@basemaps/geo';
import { fsa, LogType } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { boolean, command, flag, option, string } from 'cmd-ts';
import pLimit from 'p-limit';

import { isArgo } from '../argo.js';
import { UrlFolder } from '../cogify/parsers.js';
import { getLogger, logArguments } from '../log.js';
import { groupTiffsByDirectory } from './mappers/group-tiffs-by-directory.js';
import { mapEpsgToSlug } from './mappers/map-epsg-to-slug.js';
import { createStacCollection } from './stac/create-stac-collection.js';
import { createStacItems } from './stac/create-stac-item-groups.js';
import { writeStacFiles } from './stac/write-stac-files.js';
import { MapSheetStacItem } from './types/map-sheet-stac-item.js';

const Q = pLimit(10);
export const brokenTiffs = { noBounds: [] as string[], noEpsg: [] as string[], noSize: [] as string[] };

/**
 * List all the tiffs in a directory for topographic maps and create cogs for each.
 *
 * @param source: Location of the source files
 * @example s3://linz-topographic-upload/topographic/TopoReleaseArchive/NZTopo50_GeoTif_Gridless/
 *
 * @param target: Location of the target path
 */
export const topoStacCreation = command({
  name: 'topo-stac-creation',
  version: CliInfo.version,
  description: 'List input topographic files, create StacItems, and generate tiles for grouping.',
  args: {
    ...logArguments,
    title: option({
      type: string,
      long: 'title',
      description: 'Imported imagery title',
    }),
    source: option({
      type: UrlFolder,
      long: 'source',
      description: 'Location of the source files',
    }),
    target: option({
      type: UrlFolder,
      long: 'target',
      description: 'Target location for the output files',
    }),
    scale: option({
      type: string,
      long: 'scale',
      description: 'topo25, topo50, or topo250',
    }),
    resolution: option({
      type: string,
      long: 'resolution',
      description: 'e.g. gridless_600dpi',
    }),
    latestOnly: flag({
      type: boolean,
      defaultValue: () => false,
      long: 'latest-only',
      description: 'Only process the latest version of each map sheet',
      defaultValueIsSerializable: true,
    }),
  },
  async handler(args) {
    const logger = getLogger(this, args);
    const startTime = performance.now();
    logger.info('ListJobs:Start');

    const { epsgDirectoryPaths, stacItemPaths } = await loadTiffsToCreateStacs(
      args.latestOnly,
      args.source,
      args.target,
      args.title,
      args.scale,
      args.resolution,
      logger,
    );

    if (epsgDirectoryPaths.length === 0 || stacItemPaths.length === 0) throw new Error('No Stac items created');

    // write stac items into an JSON array
    if (isArgo()) {
      const targetURL = new URL('/tmp/topo-stac-creation/');

      // for create-config: we need to tell create-config to create a bundled config for each epsg folder (latest only).
      // workflow: will loop 'targets.json' and create a node for each path where each node's job is to create a bundled config.
      await fsa.write(new URL('targets.json', targetURL), JSON.stringify(epsgDirectoryPaths, null, 2));

      // tiles.json makes the tiff files
      await fsa.write(new URL('tiles.json', targetURL), JSON.stringify(stacItemPaths, null, 2));
      await fsa.write(new URL('brokenTiffs.json', targetURL), JSON.stringify(brokenTiffs, null, 2));
    }

    logger.info({ duration: performance.now() - startTime }, 'ListJobs:Done');
  },
});

/**
 * @param source: Source directory URL from which to load tiff files
 * @example TODO
 *
 * @param target: Destination directory URL into which to save the STAC collection and item JSON files
 * @example TODO
 *
 * @param title: The title of the collection
 * @example "New Zealand Topo50 Map Series (Gridless)"
 *
 * @returns an array of StacItem objects
 */
async function loadTiffsToCreateStacs(
  latestOnly: boolean,
  source: URL,
  target: URL,
  title: string,
  scale: string,
  resolution: string,
  logger?: LogType,
): Promise<{ epsgDirectoryPaths: { epsg: string; url: URL }[]; stacItemPaths: { path: URL }[] }> {
  logger?.info({ source }, 'LoadTiffs:Start');
  // extract all file paths from the source directory and convert them into URL objects
  const fileURLs = await fsa.toArray(fsa.list(source));
  // process all of the URL objects into Tiff objects
  const tiffs = await loadTiffsFromPaths(fileURLs, Q);
  logger?.info({ numTiffs: tiffs.length }, 'LoadTiffs:End');

  // group all of the Tiff objects by epsg and map code
  logger?.info('GroupTiffs:Start');
  const itemsByDir = await groupTiffsByDirectory(tiffs);
  const itemsByDirPath = new URL('itemsByDirectory.json', target);
  await fsa.write(itemsByDirPath, JSON.stringify(itemsByDir, null, 2));
  logger?.info('GroupTiffs:End');

  const epsgDirectoryPaths: { epsg: string; url: URL }[] = [];
  const stacItemPaths = [];

  // create and write stac items and collections
  for (const [epsg, itemsByMapCode] of itemsByDir.all.entries()) {
    const allTargetURL = new URL(`${scale}/${resolution}/${epsg}/`, target);
    const latestTargetURL = new URL(`${scale}_latest/${resolution}/${epsg}/`, target);

    const allBounds: Bounds[] = [];
    const allStacItems: MapSheetStacItem[] = [];

    const latestBounds: Bounds[] = [];
    const latestStacItems: MapSheetStacItem[] = [];

    // parse epsg
    const epsgCode = Epsg.parse(epsg);
    if (epsgCode == null) throw new Error(`Failed to parse epsg '${epsg}'`);

    // convert epsg to tile matrix
    const tileMatrix = TileMatrixSets.tryGet(epsgCode) ?? Nztm2000Tms; // TODO: support other tile matrices
    if (tileMatrix == null) throw new Error(`Failed to convert epsg code '${epsgCode.code}' to a tile matrix`);

    // create stac items
    logger?.info({ epsg }, 'CreateStacItems:Start');
    for (const [mapCode, items] of itemsByMapCode.entries()) {
      // get latest item
      const latest = itemsByDir.latest.get(epsg).get(mapCode);

      // create stac items
      const stacItems = createStacItems(allTargetURL, tileMatrix, items, latest);

      allBounds.push(...items.map((item) => item.bounds));
      allStacItems.push(...stacItems.all);

      latestBounds.push(latest.bounds);
      latestStacItems.push(stacItems.latest);
    }

    // convert epsg to slug
    const epsgSlug = mapEpsgToSlug(epsgCode.code);
    if (epsgSlug == null) throw new Error(`Failed to map epsg code '${epsgCode.code}' to a slug`);

    const linzSlug = `${scale}-${epsgSlug}`;

    // create collections
    const collection = createStacCollection(title, linzSlug, Bounds.union(allBounds), allStacItems);
    const latestCollection = createStacCollection(title, linzSlug, Bounds.union(latestBounds), latestStacItems);
    logger?.info({ epsg }, 'CreateStacItems:End');

    if (isArgo()) {
      epsgDirectoryPaths.push({ epsg, url: latestTargetURL });

      // write stac items and collections
      logger?.info({ epsg }, 'WriteStacFiles:Start');
      if (!latestOnly) {
        const allPaths = await writeStacFiles(allTargetURL, allStacItems, collection);
        stacItemPaths.push(...allPaths.itemPaths);
      }
      const latestPaths = await writeStacFiles(latestTargetURL, latestStacItems, latestCollection);
      stacItemPaths.push(...latestPaths.itemPaths);
      logger?.info({ epsg }, 'WriteStacFiles:End');
    }
  }

  return { epsgDirectoryPaths, stacItemPaths };
}
