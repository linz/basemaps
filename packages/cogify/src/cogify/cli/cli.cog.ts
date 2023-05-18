import { ProjectionLoader, TileId, TileMatrixSets } from '@basemaps/geo';
import { LogType, fsa } from '@basemaps/shared';
import { CliId, CliInfo } from '@basemaps/shared/build/cli/info.js';
import { Metrics } from '@linzjs/metrics';
import { Type, command, flag, restPositionals } from 'cmd-ts';
import { createHash } from 'crypto';
import { mkdir, rm } from 'fs/promises';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'os';
import { StacAsset, StacCollection } from 'stac-ts';
import { CutlineOptimizer } from '../../cutline.js';
import { SourceDownloader, urlToString } from '../../download.js';
import { getLogger, logArguments } from '../../log.js';
import { gdalBuildCog, gdalBuildVrt, gdalBuildVrtWarp } from '../gdal.js';
import { GdalRunner } from '../gdal.runner.js';
import { CogifyCreationOptions, CogifyStacItem, getCutline, getSources } from '../stac.js';
import { CogTiff } from '@cogeotiff/core';

function extractSourceFiles(item: CogifyStacItem, baseUrl: URL): URL[] {
  return item.links.filter((link) => link.rel === 'linz_basemaps:source').map((link) => new URL(link.href, baseUrl));
}

const Collections = new Map<string, Promise<StacCollection>>();

export interface CogItem {
  url: URL;
  item: CogifyStacItem;
  collection: StacCollection;
}
async function loadItem(url: URL, logger: LogType): Promise<CogItem | null> {
  const item = await fsa.readJson<CogifyStacItem>(urlToString(url));
  if (item.stac_version !== '1.0.0' || item.type !== 'Feature') {
    logger.warn({ path: url }, 'Cog:Skip:NotStacItem');
    return null;
  }
  const collectionLink = item.links.find((f) => f.rel === 'collection');
  if (collectionLink == null) throw new Error(`Unable to find collection for ${url}`);

  const collectionPath = new URL(collectionLink.href, url);
  const collectionPathHref = collectionPath.href;

  const collectionFetch =
    Collections.get(collectionPathHref) ?? fsa.readJson<StacCollection>(urlToString(collectionPath));
  Collections.set(collectionPathHref, collectionFetch);

  const collection = await collectionFetch;

  if (collection.stac_version !== '1.0.0') {
    throw new Error(`Invalid Collection JSON: ${item.id} stac version number mismatch ${collection.stac_version}`);
  }

  return { url: url, item, collection };
}

const Url: Type<string, URL> = {
  async from(str) {
    try {
      return new URL(str);
    } catch (e) {
      if (str.includes(':')) throw e;
      return pathToFileURL(str);
    }
  },
};

export const BasemapsCogifyCreateCommand = command({
  name: 'cogify-create',
  version: CliInfo.version,
  description: 'Create a COG from a covering configuration',
  args: {
    ...logArguments,
    path: restPositionals({ type: Url, displayName: 'path', description: 'Path to item json' }),
    force: flag({ long: 'force', description: 'Overwrite existing tiff files' }),
  },

  async handler(args) {
    const metrics = new Metrics();
    const logger = getLogger(this, args);

    const toCreate = await Promise.all(args.path.map(async (p) => loadItem(p, logger)));
    // // Filter out any missing items, also excluding items which already have COGs created
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
      for (const src of files) sources.register(new URL(src.href, i.url), i.item.id);
    }

    const gdalVersion = await new GdalRunner({ command: 'gdal_translate', args: ['--version'], output: '' }).run();

    try {
      await mkdir(tmpFolder, { recursive: true });

      // TODO should COG creation be run concurrently?
      for (const { url, item } of filtered) {
        const cutlineLink = getCutline(item.links);
        const options = item.properties['linz_basemaps:options'];
        const tileId = TileId.fromTile(options.tile);
        metrics.start(tileId);

        // Location to where the tiff should be stored
        const tiffPath = new URL(tileId + '.tiff', url);
        const itemStacPath = new URL(tileId + '.json', url);
        const tileMatrix = TileMatrixSets.find(options.tileMatrix);
        if (tileMatrix == null) throw new Error('Failed to find tileMatrix: ' + options.tileMatrix);
        const cutline = await CutlineOptimizer.loadFromLink(cutlineLink, tileMatrix);
        const sourceFiles = extractSourceFiles(item, url);
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
        logger.debug({ files: sourceFiles.length }, 'Cog:Cleanup');
        const deleted = await Promise.all(sourceFiles.map((f) => sources.done(f, item.id, logger)));
        logger.info({ files: sourceFiles.length, deleted: deleted.filter(Boolean).length }, 'Cog:Cleanup:Done');

        const asset: StacAsset = {
          href: `./${tileId}.tiff`,
          type: 'image/tiff; application=geotiff; profile=cloud-optimized',
          roles: ['data'],
        };
        // Update the item to have
        item.assets['cog'] = asset;
        item.properties['linz_basemaps:generated']['gdal'] = gdalVersion.stdout;

        const cogStat = await fsa.head(outputTiffPath);

        metrics.start(`${tileId}:write`);
        // Upload the output COG into the target location
        const readStream = fsa.stream(outputTiffPath);
        const hash = createHash('sha256');
        // readStream.on('data', (chunk) => hash.update(chunk));
        await fsa.write(urlToString(tiffPath), readStream);
        await validateOutputTiff(urlToString(tiffPath), logger);
        // Create a multihash, 0x12: sha256, 0x20: 32 characters long
        const digest = '1220' + hash.digest('hex');
        asset['file:checksum'] = digest;
        logger.debug(
          { target: tiffPath, hash: digest, size: cogStat?.size, duration: metrics.end(`${tileId}:write`) },
          'Cog:Create:Write',
        );
        // Write the STAC metadata
        await fsa.write(urlToString(itemStacPath), JSON.stringify(item, null, 2));
        logger.info({ tileId, tiffPath, duration: metrics.end(tileId) }, 'Cog:Create:Done');
      }
    } catch (err) {
      logger.error({ err }, 'Cog:Create:Failed');
      throw err;
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

async function validateOutputTiff(path: string, logger: LogType): Promise<void> {
  logger.info({ path }, 'Cog:Validate');
  try {
    const tiff = await new CogTiff(fsa.source(path)).init(true);
    const tiffStats = tiff.images.map((t) => {
      return { id: t.id, ...t.size, tiles: t.tileCount };
    });
    logger.info({ path }, 'Cog:Validate:Ok');
    logger.info({ tiffStats }, 'Cog:Validate:Stats');
    await tiff.close();
  } catch (err) {
    logger.error({ path, err }, 'Cog:ValidateFailed');
    throw err;
  }
}
