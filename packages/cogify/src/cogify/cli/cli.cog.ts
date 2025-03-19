import { isEmptyTiff } from '@basemaps/config-loader';
import { Projection, ProjectionLoader, TileId, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { fsa, LogType, stringToUrlFolder, Tiff } from '@basemaps/shared';
import { CliId, CliInfo } from '@basemaps/shared/build/cli/info.js';
import { Metrics } from '@linzjs/metrics';
import { command, flag, number, option, optional, restPositionals } from 'cmd-ts';
import { mkdir, rm } from 'fs/promises';
import { tmpdir } from 'os';
import pLimit from 'p-limit';
import path from 'path';
import { StacAsset, StacCollection } from 'stac-ts';
import { pathToFileURL } from 'url';

import { SourceDownloader } from '../../download.js';
import { HashTransform } from '../../hash.stream.js';
import { getLogger, logArguments } from '../../log.js';
import { CutlineOptimizer } from '../covering/cutline.js';
import {
  gdalBuildCog,
  gdalBuildTopoRasterCommands,
  gdalBuildVrt,
  gdalBuildVrtWarp,
  gdalCreate,
  VrtOptions,
} from '../gdal/gdal.command.js';
import { GdalRunner } from '../gdal/gdal.runner.js';
import { Url, UrlArrayJsonFile } from '../parsers.js';
import { CogifyCreationOptions, CogifyStacItem, getCutline, getSources, isTopoStacItem } from '../stac.js';

const Collections = new Map<string, Promise<StacCollection>>();

export interface CogItem {
  url: URL;
  item: CogifyStacItem;
  collection: StacCollection;
}
async function loadItem(url: URL, logger: LogType): Promise<CogItem | null> {
  const item = await fsa.readJson<CogifyStacItem>(url);
  if (item.stac_version !== '1.0.0' || item.type !== 'Feature') {
    logger.warn({ path: url }, 'Cog:Skip:NotStacItem');
    return null;
  }
  const collectionLink = item.links.find((f) => f.rel === 'collection');
  if (collectionLink == null) throw new Error(`Unable to find collection for ${url.href}`);

  const collectionPath = new URL(collectionLink.href, url);
  const collectionPathHref = collectionPath.href;

  const collectionFetch = Collections.get(collectionPathHref) ?? fsa.readJson<StacCollection>(collectionPath);
  Collections.set(collectionPathHref, collectionFetch);

  const collection = await collectionFetch;

  if (collection.stac_version !== '1.0.0') {
    throw new Error(
      `Invalid Collection JSON: ${item.id} stac version number mismatch ${String(collection.stac_version)}`,
    );
  }

  return { url: url, item, collection };
}

export const BasemapsCogifyCreateCommand = command({
  name: 'cogify-create',
  version: CliInfo.version,
  description: 'Create a COG from a covering configuration',
  args: {
    ...logArguments,
    path: restPositionals({ type: Url, displayName: 'path', description: 'Path to covering configuration' }),
    force: flag({ long: 'force', description: 'Overwrite existing tiff files' }),
    concurrency: option({
      type: number,
      long: 'concurrency',
      description: 'Number of COGS to process at the same type',
      defaultValue: () => 4,
      defaultValueIsSerializable: true,
    }),
    docker: flag({ long: 'docker', description: 'Run GDAL inside docker container' }),
    fromFile: option({
      type: optional(UrlArrayJsonFile),
      long: 'from-file',
      description:
        'Path to JSON file containing array of paths to covering configurations. ' +
        'File must be an array of objects with key "path" and value of a path to a covering configuration.',
    }),
  },

  async handler(args) {
    const metrics = new Metrics();
    const logger = getLogger(this, args);

    if (args.docker) process.env['GDAL_DOCKER'] = '1';
    const paths = args.fromFile != null ? args.path.concat(args.fromFile) : args.path;

    const toCreate = await Promise.all(paths.map(async (p) => loadItem(p, logger)));
    // // Filter out any missing items, also excluding items which already have COGs created
    const filtered = toCreate.filter((f) => {
      if (f == null) return false;

      const invalidReason = f.item.properties['linz_basemaps:generated'].invalid;

      const cogAsset = f.item.assets['cog'];
      if (cogAsset == null && invalidReason == null) return true;

      // Force overwrite existing COGs
      if (args.force) {
        logger.warn({ item: f.item.id, asset: cogAsset?.href }, 'Cog:Create:Overwrite');
        return true;
      }

      // The cog was already created but deemed invalid
      if (invalidReason) {
        logger.warn({ item: f.item.id, asset: cogAsset?.href, reason: invalidReason }, 'Cog:Create:Exists:invalid');
        return false;
      }

      logger.info({ item: f.item.id, asset: cogAsset?.href }, 'Cog:Create:Exists');
      return false;
    }) as CogItem[];

    // No items left to be created
    if (filtered.length === 0) {
      logger.info({ toCreate: filtered.length }, 'Cog:Create:Done');
      return;
    }
    const tmpFolder = stringToUrlFolder(path.join(tmpdir(), CliId));

    // Get list of unique source files needed for all files
    const sources = new SourceDownloader(tmpFolder);
    for (const i of filtered) {
      const files = getSources(i.item.links);
      for (const src of files) sources.register(new URL(src.href, i.url), i.item.id);
    }

    // Check that we have read access to all the hosts that have files that we need
    // This prevents us assuming a multiple roles when file are attempted to download
    await Promise.all(
      [...sources.hosts].map(async ([hostName, url]) => {
        logger.debug({ hostName }, 'Cog:Create:ValidateAccess');
        await fsa.head(url);
        logger.info({ hostName, url }, 'Cog:Create:ValidateAccess:Ok');
      }),
    );

    const gdalVersion = await new GdalRunner({
      command: 'gdal_translate',
      args: ['--version'],
      output: pathToFileURL('.'),
    }).run();

    /** Limit the creation of COGs to concurrency at the same time */
    const Q = pLimit(args.concurrency);

    try {
      await mkdir(tmpFolder, { recursive: true });

      const promises = filtered.map(async (f) => {
        const { item, url } = f;

        const cutlineLink = getCutline(item.links);
        const options = item.properties['linz_basemaps:options'];
        const tileId = isTopoStacItem(item) ? item.id : TileId.fromTile(options.tile);

        // Location to where the tiff should be stored
        const tiffPath = new URL(tileId + '.tiff', url);
        const itemStacPath = new URL(tileId + '.json', url);
        const tileMatrix = TileMatrixSets.find(options.tileMatrix);
        if (tileMatrix == null) throw new Error('Failed to find tileMatrix: ' + options.tileMatrix);
        const sourceFiles = getSources(item.links);

        // Skip creating the COG if the item STAC contains no source tiffs
        if (sourceFiles.length === 0) {
          logger.error({ stacPath: itemStacPath, target: tiffPath }, 'Cog:NoSourceFiles');
          return;
        }

        // Create the tiff concurrently
        const outputTiffPath = await Q(async () => {
          metrics.start(tileId); // Only start the timer when the cog is actually being processed

          // Download all tiff files needed for the processing
          const sourceLocations = await Promise.all(
            sourceFiles.map((link) => sources.get(new URL(link.href, url), logger)),
          );

          const cutline = await CutlineOptimizer.loadFromLink(cutlineLink, tileMatrix);
          if (isTopoStacItem(item)) {
            if (sourceFiles.length !== 1) {
              throw new Error('Topo MapSheet procesing is limited to one input file, found: ' + sourceLocations.length);
            }
            const width = sourceFiles[0]['linz_basemaps:source_width'];
            const height = sourceFiles[0]['linz_basemaps:source_height'];
            return createTopoCog({
              tileId,
              options,
              tempFolder: tmpFolder,
              sourceFiles: sourceLocations,
              cutline,
              size: { width, height },
              logger,
            });
          }

          return createCog({
            tileId,
            options,
            tempFolder: tmpFolder,
            sourceFiles: sourceLocations,
            cutline,
            logger,
          });
        });

        // Cleanup any source files used in the COG creation
        logger.debug({ files: sourceFiles.length }, 'Cog:Cleanup');
        const deleted = await Promise.all(
          sourceFiles.map(async (f) => {
            const sourceLocation = new URL(f.href, url);
            const asset = sources.items.get(sourceLocation.href);
            await sources.done(sourceLocation, item.id, logger);
            // Update the STAC Document with the checksum and file size of the files used to create this asset
            if (asset == null || asset.size == null || asset.hash == null) return;
            const link = item.links.find((link) => new URL(link.href, url).href === asset.url.href);
            if (link == null) return;
            // Checksum differs in the STAC document to what was downloaded
            if (link['file:checksum'] && link['file:checksum'] !== asset.hash) {
              logger.warn(
                { path: f.href, linkHash: link['file:checksum'], assetHash: asset.hash },
                'FileHash:Mismatch',
              );
            }
            link['file:checksum'] = asset.hash;
            if (link['file:size'] && link['file:size'] !== asset.size) {
              logger.warn({ path: f.href, linkSize: link['file:size'], assetSize: asset.size }, 'FileSize:Mismatch');
            }
            link['file:size'] = asset.size;
          }),
        );
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
        if (await isEmptyTiff(outputTiffPath)) {
          // Empty tiff created, remove it from the stac
          logger.warn({ tileId, tiffPath }, 'Cog:Empty');
          delete item.assets['cog'];
          item.properties['linz_basemaps:generated'].invalid = 'empty';
        } else {
          metrics.start(`${tileId}:write`);
          // Upload the output COG into the target location
          const readStream = fsa.readStream(outputTiffPath).pipe(new HashTransform('sha256'));
          await fsa.write(tiffPath, readStream);
          await validateOutputTiff(tiffPath, tileMatrix, logger);

          asset['file:checksum'] = readStream.multihash;
          asset['file:size'] = readStream.size;
          if (readStream.size !== cogStat?.size) {
            logger.warn({ readStream: readStream.size, stat: cogStat?.size }, 'SizeMismatch');
          }

          logger.debug(
            {
              target: tiffPath,
              hash: asset['file:checksum'],
              size: asset['file:size'],
              duration: metrics.end(`${tileId}:write`),
            },
            'Cog:Create:Write',
          );
        }
        // Write the STAC metadata
        await fsa.write(itemStacPath, JSON.stringify(item, null, 2));
        logger.info({ tileId, tiffPath, duration: metrics.end(tileId) }, 'Cog:Create:Done');
      });

      await Promise.all(promises);
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
        files: filtered.map((f) => {
          return isTopoStacItem(f.item) ? f.item.id : TileId.fromTile(f.item.properties['linz_basemaps:options'].tile);
        }),
      },
      'Cog:Done',
    );
  },
});

export interface CogCreationContext {
  /** TileId for the file name */
  tileId: string;
  /** COG Creation options */
  options: CogifyCreationOptions;
  /** Location to store all the temporary files */
  tempFolder: URL;
  /** List of source tiffs paths needed for the cog */
  sourceFiles: URL[];
  /** Optional cutline to cut the imagery too */
  cutline: CutlineOptimizer;
  /** Optional Source imagery size for topo raster trim pixel */
  size?: { width: number; height: number };
  /** Optional logger */
  logger?: LogType;
}

/** Create a generic COG from the creation options */
async function createCog(ctx: CogCreationContext): Promise<URL> {
  const options = ctx.options;
  await ProjectionLoader.load(options.sourceEpsg);
  const tileId = ctx.tileId;

  const logger = ctx.logger?.child({ tileId });

  logger?.info({ tileId }, 'Cog:Create');

  const tileMatrix = TileMatrixSets.find(options.tileMatrix);
  if (tileMatrix == null) throw new Error('Failed to find tile matrix: ' + options.tileMatrix);

  logger?.debug({ tileId }, 'Cog:Create:VrtSource');

  const vrtOpts: VrtOptions = {};
  // If there is a one band input eg a grey scale image and we are trying to get a
  // 4 band RGBA output we need to ensure there is alpha and band expansion
  if (ctx.options.preset === 'webp' && ctx.options.sourceBands?.join(',') === 'uint8') {
    vrtOpts.addAlpha = true;
  }

  // Create the vrt of all the source files
  const vrtSourceCommand = gdalBuildVrt(new URL(`${tileId}-source.vrt`, ctx.tempFolder), ctx.sourceFiles, vrtOpts);
  await new GdalRunner(vrtSourceCommand).run(logger);

  logger?.debug({ tileId }, 'Cog:Create:VrtWarp');

  const cutlineProperties: { url: URL | null; blend: number } = { url: null, blend: ctx.cutline.blend };
  if (ctx.cutline) {
    logger?.debug('Cog:Cutline');
    const optimizedCutline = ctx.cutline.optimize(options.tile);
    if (optimizedCutline) {
      cutlineProperties.url = new URL(`${tileId}-cutline.geojson`, ctx.tempFolder);
      await fsa.write(cutlineProperties.url, JSON.stringify(optimizedCutline));
      logger?.info({ source: ctx.cutline.path, optimized: cutlineProperties.url }, 'Cog:Cutline');
    } else {
      logger?.info('Cog:Cutline:Skipped');
    }
  }

  // warp the source VRT into the output parameters
  const vrtWarpCommand = gdalBuildVrtWarp(
    new URL(`${tileId}-${options.tileMatrix}-warp.vrt`, ctx.tempFolder),
    vrtSourceCommand.output,
    options.sourceEpsg,
    cutlineProperties,
    options,
  );
  await new GdalRunner(vrtWarpCommand).run(logger);

  if (options.background == null) {
    // Create the COG from the warped vrt without a forced background
    const cogCreateCommand = gdalBuildCog(new URL(`${tileId}.tiff`, ctx.tempFolder), vrtWarpCommand.output, options);
    await new GdalRunner(cogCreateCommand).run(logger);
    return cogCreateCommand.output;
  }

  // Create a colored background tiff to fill the empty space in the target cog
  const gdalCreateCommand = gdalCreate(new URL(`${tileId}-bg.tiff`, ctx.tempFolder), options.background, options);
  await new GdalRunner(gdalCreateCommand).run(logger);

  // Create a vrt with the background tiff behind the source file vrt
  const vrtMergeCommand = gdalBuildVrt(new URL(`${tileId}-merged.vrt`, ctx.tempFolder), [
    gdalCreateCommand.output,
    vrtWarpCommand.output,
  ]);
  await new GdalRunner(vrtMergeCommand).run(logger);

  // Create the COG from the merged vrt with a forced background
  const cogCreateCommand = gdalBuildCog(new URL(`${tileId}.tiff`, ctx.tempFolder), vrtMergeCommand.output, options);
  await new GdalRunner(cogCreateCommand).run(logger);
  return cogCreateCommand.output;
}

/** Create a COG specific to LINZ's Topographic 50k and 250k map series from the creation options */
async function createTopoCog(ctx: CogCreationContext): Promise<URL> {
  const options = ctx.options;
  await ProjectionLoader.load(options.sourceEpsg);
  const tileId = ctx.tileId;

  const logger = ctx.logger?.child({ tileId });

  logger?.debug({ tileId }, 'TopoCog:Create:VrtSource');
  // Create the vrt of all the source files
  const vrtSourceCommand = gdalBuildVrt(new URL(`${tileId}-source.vrt`, ctx.tempFolder), ctx.sourceFiles, {
    addAlpha: true,
  });
  await new GdalRunner(vrtSourceCommand).run(logger);

  // Create the COG from the vrt file
  if (ctx.size == null) throw new Error('TopoCog: Source image size is required for pixel trim');
  const cogCreateCommand = gdalBuildTopoRasterCommands(
    new URL(`${tileId}.tiff`, ctx.tempFolder),
    vrtSourceCommand.output,
    options,
    ctx.size?.width,
    ctx.size?.height,
  );
  await new GdalRunner(cogCreateCommand).run(logger);
  return cogCreateCommand.output;
}

/**
 * Very basic checking for the output tiff to ensure it was uploaded ok
 * Just open it as a COG and ensure the metadata looks about  right
 */
export async function validateOutputTiff(
  url: URL,
  tileMatrix: TileMatrixSet | undefined,
  logger: LogType,
): Promise<void> {
  logger.info({ url }, 'Cog:Validate');
  try {
    const tiff = await Tiff.create(fsa.source(url));
    const tms = tileMatrix ?? TileMatrixSets.tryGet(tiff.images[0].epsg);
    if (tms == null) throw new Error('Unknown EPSG');

    const tiffStats = tiff.images.map((t) => {
      // all internal images should be approximately aligned to a tile matrix
      const resolution = t.resolution[0];
      const closestZoom = Projection.getTiffResZoom(tms, resolution);
      const zoomScale = tms.pixelScale(closestZoom);
      const zoomDiff = Math.abs(zoomScale - resolution);

      const obj = {
        id: t.id,
        ...t.size,
        tiles: t.tileCount,
        resolution,
        zResolution: zoomScale,
        z: closestZoom,
        isResolutionOk: zoomDiff < 1e-8,
      };
      logger.debug({ url, imageStats: obj }, 'Cog:Validate:Image');
      return obj;
    });
    logger.info({ url }, 'Cog:Validate:Ok');
    logger.info({ url, tiffStats }, 'Cog:Validate:Stats');
    await tiff.source.close?.();
  } catch (err) {
    logger.error({ url, err }, 'Cog:ValidateFailed');
    throw err;
  }
}
