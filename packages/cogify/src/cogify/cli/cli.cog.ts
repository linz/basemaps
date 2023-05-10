import { ProjectionLoader, TileId, TileMatrixSets } from '@basemaps/geo';
import { LogType, fsa } from '@basemaps/shared';
import { CliId, CliInfo } from '@basemaps/shared/build/cli/info.js';
import { command, flag, restPositionals, string } from 'cmd-ts';
import { createHash } from 'crypto';
import { mkdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { dirname } from 'path';
import { StacAsset, StacCollection, StacItem } from 'stac-ts';
import { CutlineOptimizer } from '../../cutline.js';
import { SourceDownloader } from '../../download.js';
import { getLogger, logArguments } from '../../log.js';
import { gdalBuildCog, gdalBuildVrt, gdalBuildVrtWarp } from '../gdal.js';
import { GdalRunner } from '../gdal.runner.js';
import { CogifyCreationOptions, CogifyStacItem, getCutline, getSources } from '../stac.js';

function extractSourceFiles(item: CogifyStacItem): string[] {
  return item.links.filter((link) => link.rel === 'linz_basemaps:source').map((link) => link.href);
}

function isUrl(path: string): boolean {
  try {
    new URL(path);
    return true;
  } catch (e) {
    return false;
  }
}

const Collections = new Map<string, Promise<StacCollection>>();

export interface CogItem {
  itemPath: string;
  item: CogifyStacItem;
  collection: StacCollection;
}
async function loadItem(p: string, logger: LogType): Promise<CogItem | null> {
  const item = await fsa.readJson<CogifyStacItem>(p);
  if (item.stac_version !== '1.0.0' || item.type !== 'Feature') {
    logger.warn({ path: p }, 'Cog:Skip:NotStacItem');
    return null;
  }
  const collectionLink = item.links.find((f) => f.rel === 'collection');
  if (collectionLink == null) throw new Error(`Unable to find collection for ${p}`);

  const itemPath = dirname(p);
  const collectionPath = isUrl(collectionLink.href) ? collectionLink.href : fsa.join(dirname(p), collectionLink.href);

  const collectionFetch = Collections.get(collectionPath) ?? fsa.readJson<StacCollection>(collectionPath);
  Collections.set(collectionPath, collectionFetch);

  const collection = await collectionFetch;

  if (collection.stac_version !== '1.0.0') {
    throw new Error(`Invalid Collection JSON: ${item.id} stac version number mismatch ${collection.stac_version}`);
  }

  return { itemPath, item, collection };
}

export const BasemapsCogifyCreateCommand = command({
  name: 'cogify-create',
  version: CliInfo.version,
  description: 'Create a COG from a covering configuration',
  args: {
    ...logArguments,
    path: restPositionals({ type: string, displayName: 'path', description: 'Path to item json' }),
    force: flag({ long: 'force', description: 'Overwrite existing tiff files' }),
  },

  async handler(args) {
    const logger = getLogger(this, args);

    const toCreate = await Promise.all(args.path.map(async (p) => loadItem(p, logger)));
    // Filter out any missing items, also excluding items which already have COGs created
    const filtered = toCreate.filter((f) => {
      if (f == null) return false;

      const cogAsset = f.item.assets['cog'];
      if (cogAsset == null) return true;
      // Force overwrite existing COGs
      if (args.force) {
        logger.warn({ item: f.item.id, asset: cogAsset.href }, 'Cog:Create:Overwrite');
        return true;
      }

      logger.info({ item: f.item.id, asset: cogAsset.href }, 'Cog:Create:Exists');
      return false;
    }) as CogItem[];

    // No items left to be created
    if (filtered.length === 0) {
      logger.info({ toCreate: filtered.length }, 'Cog:Create:Done');
      return;
    }
    const tmpFolder = fsa.join(tmpdir(), CliId);

    // Get list of unique source files needed for all files
    const sources = new SourceDownloader(tmpFolder);
    for (const i of filtered) {
      const files = getSources(i.item.links);
      for (const src of files) sources.register(src.href, i.item.id);
    }

    const gdalVersion = await new GdalRunner({ command: 'gdal_translate', args: ['--version'], output: '' }).run();

    try {
      await mkdir(tmpFolder, { recursive: true });

      // TODO should COG creation be run concurrently?
      for (const { itemPath, item } of filtered) {
        const cutlineLink = getCutline(item.links);
        const options = item.properties['linz_basemaps:options'];
        const tileId = TileId.fromTile(options.tile);

        // Location to where the tiff should be stored
        const tiffPath = fsa.join(itemPath, tileId + '.tiff');
        const itemStacPath = fsa.join(itemPath, tileId + '.json');
        const tileMatrix = TileMatrixSets.find(options.tileMatrix);
        if (tileMatrix == null) throw new Error('Failed to find tileMatrix: ' + options.tileMatrix);
        const cutline = await CutlineOptimizer.loadFromLink(cutlineLink, tileMatrix);
        const sourceFiles = extractSourceFiles(item);
        const sourceLocations = await Promise.all(sourceFiles.map((f) => sources.get(f, logger)));
        // Create the tiff
        const outputTiffPath = await createCog({
          options,
          tempFolder: tmpFolder,
          sourceFiles: sourceLocations,
          cutline,
          logger,
        });
        // Cleanup any source files used in the COG creation
        await Promise.all(sourceFiles.map((f) => sources.done(f, item.id, logger)));

        const asset: StacAsset = {
          href: `./${tileId}.tiff`,
          type: 'image/tiff; application=geotiff; profile=cloud-optimized',
          roles: ['data'],
        };
        // Update the item to have
        item.assets['cog'] = asset;
        item.properties['linz_basemaps:generated']['gdal'] = gdalVersion.stdout;

        const startTime = performance.now();
        // Upload the output COG into the target location
        const readStream = fsa.stream(outputTiffPath);
        const hash = createHash('sha256');
        readStream.on('data', (chunk) => hash.update(chunk));
        await fsa.write(tiffPath, readStream);

        // Create a multihash, 0x12: sha256, 0x20: 32 characters long
        const digest = '1220' + hash.digest('hex');
        asset['file:checksum'] = digest;
        logger.debug({ target: tiffPath, hash: digest, duration: performance.now() - startTime }, 'Cog:Create:Write');
        // Write the STAC metadata
        await fsa.write(itemStacPath, JSON.stringify(item, null, 2));
        logger.info({ tileId, tiffPath }, 'Cog:Create:Done');
      }
    } finally {
      // Cleanup the temporary folder once everything is done
      logger.info({ path: tmpFolder }, 'Cog:Cleanup');
      await rm(tmpFolder, { recursive: true, force: true });
    }
    logger.info(
      {
        count: toCreate.length,
        created: filtered.length,
        files: filtered.map((f) => TileId.fromTile(f.item.properties['linz_basemaps:options'].tile)),
      },
      'Cog:Done',
    );
  },
});

export interface CogCreationContext {
  /** COG Creation options */
  options: CogifyCreationOptions;
  /** Location to store all the temporary files */
  tempFolder: string;
  /** List of source tiffs paths needed for the cog */
  sourceFiles: string[];
  /** Optional cutline to cut the imagery too */
  cutline: CutlineOptimizer;
  /** Optional logger */
  logger?: LogType;
}

/** Create a cog from the creation options */
async function createCog(ctx: CogCreationContext): Promise<string> {
  const options = ctx.options;
  await ProjectionLoader.load(options.sourceEpsg);
  const tileId = TileId.fromTile(options.tile);

  const logger = ctx.logger?.child({ tileId });

  logger?.info({ tileId }, 'Cog:Create');

  // Path to store all the temporary files  generally `/tmp/:id/:tileId-*`
  const tmpItemPath = fsa.join(ctx.tempFolder, tileId);

  const tileMatrix = TileMatrixSets.find(options.tileMatrix);
  if (tileMatrix == null) throw new Error('Failed to find tile matrix: ' + options.tileMatrix);

  logger?.debug({ tileId }, 'Cog:Create:VrtSource');
  // Create the vrt of all the source files
  const vrtSourceCommand = gdalBuildVrt(tmpItemPath + '-source', ctx.sourceFiles);
  await new GdalRunner(vrtSourceCommand).run(logger);

  logger?.debug({ tileId }, 'Cog:Create:VrtWarp');

  const cutlineProperties: { path: string | null; blend: number } = { path: null, blend: ctx.cutline.blend };
  if (ctx.cutline.path) {
    logger?.debug('Cog:Cutline');
    const optimizedCutline = ctx.cutline.optimize(options.tile);
    if (optimizedCutline) {
      cutlineProperties.path = tmpItemPath + '-cutline.geojson';
      const cutlineData = JSON.stringify(optimizedCutline, null, 2);
      await fsa.write(cutlineProperties.path, cutlineData);
      logger?.info({ source: ctx.cutline.path, optimized: cutlineProperties.path }, 'Cog:Cutline');
    } else {
      logger?.info('Cog:Cutline:Skipped');
    }
  }

  // warp the source VRT into the output parameters
  const vrtWarpCommand = gdalBuildVrtWarp(
    tmpItemPath + '-warp',
    vrtSourceCommand.output,
    options.sourceEpsg,
    cutlineProperties,
    options,
  );
  await new GdalRunner(vrtWarpCommand).run(logger);

  logger?.debug({ tileId }, 'Cog:Create:Tiff');
  // Create the COG from the warped vrt
  const cogCreateCommand = gdalBuildCog(tmpItemPath, vrtWarpCommand.output, options);
  await new GdalRunner(cogCreateCommand).run(logger);
  return cogCreateCommand.output;
}
