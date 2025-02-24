import { loadTiffsFromPaths } from '@basemaps/config-loader/build/json/tiff.config.js';
import { Bounds } from '@basemaps/geo';
import { fsa, LogType } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { boolean, command, flag, option, string } from 'cmd-ts';
import pLimit from 'p-limit';

import { isArgo } from '../../argo.js';
import { UrlFolder } from '../../cogify/parsers.js';
import { getLogger, logArguments } from '../../log.js';
import { brokenTiffs, extractLatestTiffItemsByMapCode, extractTiffItemsByEpsg } from '../topo/extract.js';
import { mapEpsgToSlug } from '../topo/slug.js';
import { createStacCollection, createStacItems, writeStacFiles } from '../topo/stac.creation.js';

const Q = pLimit(10);

export interface TopoCreationContext {
  /** Only create cogs for the latest topo tiffs by map code and version */
  latestOnly: boolean;
  /** Source location of topo tiffs */
  source: URL;
  /** Target location for the output stac files */
  target: URL;
  /** Imagery title */
  title: string;
  /** Input topo imagery scale, topo25, topo50, or topo250*/
  scale: string;
  /** Input topo imagery resolution, e.g. gridless_600dpi*/
  resolution: string;
  /** force to output if not in argo */
  forceOutput: boolean;
  /** Optional logger to trace covering creation */
  logger?: LogType;
}

/**
 * Parses a source path directory topographic maps tiffs and writes out a directory structure
 * of StacItem and StacCollection files to the target path.
 *
 * @param source: Location of the source files
 * @example s3://linz-topographic-upload/topographic/TopoReleaseArchive/NZTopo50_GeoTif_Gridless/
 *
 * @param target: Location of the target path
 */
export const TopoStacCreationCommand = command({
  name: 'cogify-topo-stac',
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
    forceOutput: flag({
      type: boolean,
      defaultValue: () => false,
      long: 'force-output',
      defaultValueIsSerializable: true,
    }),
  },
  async handler(args) {
    const logger = getLogger(this, args);
    const startTime = performance.now();
    logger.info('ListJobs:Start');

    const ctx: TopoCreationContext = {
      latestOnly: args.latestOnly,
      source: args.source,
      target: args.target,
      title: args.title,
      scale: args.scale,
      resolution: args.resolution,
      forceOutput: args.forceOutput,
      logger,
    };
    const { epsgDirectoryPaths, stacItemPaths } = await loadTiffsToCreateStacs(ctx);

    if (epsgDirectoryPaths.length === 0 || stacItemPaths.length === 0) throw new Error('No Stac items created');

    // write stac items into an JSON array
    if (args.forceOutput || isArgo()) {
      const targetUrl = isArgo() ? fsa.toUrl('/tmp/topo-stac-creation/') : args.target;

      // for create-config: we need to tell create-config to create a bundled config for each epsg folder (latest only).
      // workflow: will loop 'targets.json' and create a node for each path where each node's job is to create a bundled config.
      await fsa.write(new URL('targets.json', targetUrl), JSON.stringify(epsgDirectoryPaths, null, 2));

      // tiles.json makes the tiff files
      await fsa.write(new URL('tiles.json', targetUrl), JSON.stringify(stacItemPaths, null, 2));
      await fsa.write(new URL('broken-tiffs.json', targetUrl), JSON.stringify(brokenTiffs, null, 2));
    }

    logger.info({ duration: performance.now() - startTime }, 'ListJobs:Done');
  },
});

/**
 * @param source: Source directory URL from which to load tiff files
 *
 * @param target: Destination directory URL into which to save the STAC collection and item JSON files
 *
 * @param title: The title of the collection
 * @example "New Zealand Topo50 Map Series (Gridless)"
 *
 * @returns an array of StacItem objects
 */
async function loadTiffsToCreateStacs(
  ctx: TopoCreationContext,
): Promise<{ epsgDirectoryPaths: { epsg: string; url: URL }[]; stacItemPaths: { path: URL }[] }> {
  const logger = ctx.logger;
  const source = ctx.source;
  const target = ctx.target;
  logger?.info({ source }, 'LoadTiffs:Start');
  // extract all file paths from the source directory and convert them into URLs
  const fileURLs = await fsa.toArray(fsa.list(source));
  // process all of the URLs into Tiffs
  const tiffs = await loadTiffsFromPaths(fileURLs, Q);
  logger?.info({ numTiffs: tiffs.length }, 'LoadTiffs:End');

  logger?.info('ExtractTiffs:Start');
  const allTiffItems = extractTiffItemsByEpsg(tiffs, logger);
  logger?.info('ExtractTiffs:End');

  const epsgDirectoryPaths: { epsg: string; url: URL }[] = [];
  const stacItemPaths = [];

  // create and write stac items and collections
  const scale = ctx.scale;
  const resolution = ctx.resolution;

  for (const [epsg, tiffItems] of allTiffItems.entries()) {
    logger?.info({ epsg }, 'CreateStacFiles:Start');

    // identify latest tiff items
    const latestTiffItems = extractLatestTiffItemsByMapCode(tiffItems);

    // create stac items
    const stacItems = createStacItems(scale, resolution, tiffItems, latestTiffItems, logger);

    // convert epsg to slug
    const epsgSlug = mapEpsgToSlug(epsg.code);
    if (epsgSlug == null) throw new Error(`Failed to map epsg code '${epsg.code}' to a slug`);

    const linzSlug = `${scale}-${epsgSlug}`;

    // extract bounds
    const allBounds: Bounds[] = tiffItems.map((item) => item.bounds);
    const latestBounds: Bounds[] = Array.from(latestTiffItems.values()).map((item) => item.bounds);

    // create stac collections
    const title = ctx.title;
    const collection = createStacCollection(title, linzSlug, epsg, Bounds.union(allBounds), stacItems.all, logger);
    const latestCollection = createStacCollection(
      title,
      linzSlug,
      epsg,
      Bounds.union(latestBounds),
      stacItems.latest,
      logger,
    );
    logger?.info({ epsg }, 'CreateStacFiles:End');

    // construct target URLs
    const allTargetURL = new URL(`${scale}/${resolution}/${epsg.code}/`, target);
    const latestTargetURL = new URL(`${scale}_latest/${resolution}/${epsg.code}/`, target);

    if (ctx.forceOutput || isArgo()) {
      epsgDirectoryPaths.push({ epsg: epsg.code.toString(), url: latestTargetURL });

      // write stac items and collections
      logger?.info({ epsg }, 'WriteStacFiles:Start');
      if (!ctx.latestOnly) {
        const allPaths = await writeStacFiles(allTargetURL, stacItems.all, collection, logger);
        stacItemPaths.push(...allPaths.itemPaths);
      }
      const latestPaths = await writeStacFiles(latestTargetURL, stacItems.latest, latestCollection, logger);
      stacItemPaths.push(...latestPaths.itemPaths);
      logger?.info({ epsg }, 'WriteStacFiles:End');
    }
  }

  return { epsgDirectoryPaths, stacItemPaths };
}
