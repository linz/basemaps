import { loadTiffsFromPaths } from '@basemaps/config-loader/build/json/tiff.config.js';
import { Bounds } from '@basemaps/geo';
import { fsa, LogType } from '@basemaps/shared';
import { getLogger, isArgo, logArguments, Url, UrlFolder } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { boolean, command, flag, oneOf, option, optional, restPositionals, string } from 'cmd-ts';
import pLimit from 'p-limit';

import { brokenTiffs, extractLatestTiffItemsByMapCode, extractTiffItemsByEpsg } from '../topo/extract.js';
import { mapEpsgToSlug } from '../topo/slug.js';
import { createStacCollection, createStacItems, writeStacFiles } from '../topo/stac.creation.js';

const Q = pLimit(10);

export interface TopoCreationContext {
  /** Only create cogs for the latest topo tiffs by map code and version */
  latestOnly: boolean;
  /** Source location of topo tiffs */
  paths: URL[];
  /** Target location for the output stac files */
  target: URL;
  /** Imagery title */
  title: string;
  /** Input topo imagery scale: topo25, topo50, or topo250*/
  mapSeries: MapSeries;
  /** Input topo imagery format: gridded, or gridless */
  format: Format;
  /** force output if not in argo */
  output?: URL;
  /** Logger to trace creation */
  logger: LogType;
}

const Format = ['gridded', 'gridless'];
export type Format = 'gridded' | 'gridless';

const MapSeries = ['topo25', 'topo50', 'topo250'];
export type MapSeries = 'topo25' | 'topo50' | 'topo250';

const MapSeriesTitle: Record<MapSeries, string> = {
  topo25: 'Raster Topographic Maps 25k',
  topo50: 'Raster Topographic Maps 50k',
  topo250: 'Raster Topographic Maps 250k',
};

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
  description: 'List input topographic map files, create StacItems, and generate tiles for grouping.',
  args: {
    ...logArguments,
    title: option({
      type: optional(string),
      long: 'title',
      description: 'Imported imagery title. By default, the title is derived from the map series name',
    }),
    target: option({
      type: UrlFolder,
      long: 'target',
      description: 'Target location for the output files',
    }),
    mapSeries: option({
      type: oneOf(MapSeries),
      long: 'map-series',
      description: `Map series scale. Either ${MapSeries.join(', ')}`,
    }),
    format: option({
      type: oneOf(Format),
      long: 'format',
      description: `Map sheet format. Either ${Format.join(', ')}`,
    }),
    latestOnly: flag({
      type: boolean,
      defaultValue: () => false,
      long: 'latest-only',
      description: 'Only process the latest version of each map sheet',
      defaultValueIsSerializable: true,
    }),
    output: option({
      type: optional(Url),
      description: 'Output informational assets to specific location',
      long: 'output',
    }),
    paths: restPositionals({
      type: UrlFolder,
      description: 'Location of the source files',
    }),
  },
  async handler(args) {
    const logger = getLogger(this, args, 'cli-raster');
    const startTime = performance.now();
    logger.info('TopoCogify:Start');

    const mapSeries = args.mapSeries as MapSeries;
    const format = args.format as Format;

    const title = args.title ?? MapSeriesTitle[mapSeries];

    const ctx: TopoCreationContext = {
      latestOnly: args.latestOnly,
      paths: args.paths,
      target: args.target,
      title,
      mapSeries,
      format,
      output: args.output,
      logger,
    };
    const { epsgDirectoryPaths, stacItemPaths } = await loadTiffsToCreateStacs(ctx);

    if (epsgDirectoryPaths.length === 0 || stacItemPaths.length === 0) throw new Error('No Stac items created');

    // write stac items into an JSON array
    if (args.output || isArgo()) {
      const targetUrl = args.output ?? fsa.toUrl('/tmp/topo-stac-creation/');

      // for create-config: we need to tell create-config to create a bundled config for each epsg folder (latest only).
      // workflow: will loop 'targets.json' and create a node for each path where each node's job is to create a bundled config.
      await fsa.write(new URL('targets.json', targetUrl), JSON.stringify(epsgDirectoryPaths, null, 2));

      // tiles.json makes the tiff files
      await fsa.write(
        new URL('tiles.json', targetUrl),
        JSON.stringify(
          stacItemPaths.map((m) => ({ path: m })),
          null,
          2,
        ),
      );
      await fsa.write(new URL('broken-tiffs.json', targetUrl), JSON.stringify(brokenTiffs, null, 2));
    }

    logger.info({ duration: performance.now() - startTime }, 'TopoCogify:Done');
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
): Promise<{ epsgDirectoryPaths: { epsg: string; url: URL }[]; stacItemPaths: URL[] }> {
  const logger = ctx.logger;
  const source = ctx.paths;
  const target = ctx.target;
  logger?.info({ source }, 'LoadTiffs:Start');
  // extract all file paths from the source directory and convert them into URLs
  const fileUrls: URL[] = [];

  for (const sourcePath of ctx.paths) {
    for await (const path of fsa.list(sourcePath)) {
      fileUrls.push(path);
    }
  }
  // process all of the URLs into Tiffs
  const tiffs = await loadTiffsFromPaths(fileUrls, Q);

  if (tiffs.length === 0) throw new Error('No TIFF files found in locations : ' + source.map((m) => m.href).join(', '));
  logger.info({ count: tiffs.length, hrefs: source.map((m) => m.href) }, 'LoadTiffs:End');

  logger.info('ExtractTiffs:Start');
  const allTiffItems = await extractTiffItemsByEpsg(tiffs, logger);
  logger.info({ foundEpsgs: [...allTiffItems.keys()] }, 'ExtractTiffs:End');

  const epsgDirectoryPaths: { epsg: string; url: URL }[] = [];
  const stacItemPaths: URL[] = [];

  // create and write stac items and collections
  const mapSeries = ctx.mapSeries;

  // TODO: resolution is defined from the GSD over the map scale,
  // and can be extracted in the future if we want to process higher resolution maps
  const resolution = `${ctx.format}_600dpi`;

  for (const [epsg, tiffItems] of allTiffItems.entries()) {
    logger?.info({ epsg }, 'CreateStacFiles:Start');

    // identify latest tiff items
    const latestTiffItems = extractLatestTiffItemsByMapCode(tiffItems);

    // create stac items
    const stacItems = createStacItems(mapSeries, resolution, tiffItems, latestTiffItems, logger);

    // convert epsg to slug
    const linzSlug = mapEpsgToSlug(mapSeries, epsg);
    if (linzSlug == null) throw new Error(`Failed to map epsg code '${epsg.code}' to a slug`);

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

    // Write all stac items and collections
    if (!ctx.latestOnly) {
      const allTargetURL = new URL(`${mapSeries}/${resolution}/${epsg.code}/`, target);
      logger?.info({ epsg, target: allTargetURL.href }, 'WriteStacFiles:Start');
      const allPaths = await writeStacFiles(allTargetURL, stacItems.all, collection, logger);
      stacItemPaths.push(...allPaths.items);
    }

    // Write latest stac items and collections
    const latestTargetURL = new URL(`${mapSeries}_latest/${resolution}/${epsg.code}/`, target);
    epsgDirectoryPaths.push({ epsg: epsg.code.toString(), url: latestTargetURL });

    logger?.info({ epsg, target: latestTargetURL.href }, 'WriteStacFiles:Start');
    const latestPaths = await writeStacFiles(latestTargetURL, stacItems.latest, latestCollection, logger);
    stacItemPaths.push(...latestPaths.items);
    logger?.info({ epsg }, 'WriteStacFiles:End');
  }

  return { epsgDirectoryPaths, stacItemPaths };
}
