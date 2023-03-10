import { sha256base58 } from '@basemaps/config';
import { LogType } from '@basemaps/config/src/json/log.js';
import { TileId, TileMatrixSets } from '@basemaps/geo';
import { fsa } from '@basemaps/shared';
import { CliId, CliInfo } from '@basemaps/shared/build/cli/info.js';
import { command, flag, option, positional, string } from 'cmd-ts';
import { createHash } from 'crypto';
import { mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { dirname, extname } from 'path';
import { StacAsset } from 'stac-ts';
import { CutlineOptimizer } from '../../cutline.js';
import { getLogger, logArguments } from '../../log.js';
import { gdalBuildCog, gdalBuildVrt, gdalBuildVrtWarp } from '../gdal.js';
import { GdalRunner } from '../gdal.runner.js';
import { CogifyCreationOptions, CogifyStacCollection, CogifyStacItem, getCutline, getSources } from '../stac.js';

export function parseIndexNumbers(s: string): number[] {
  if (s.includes(',')) return s.split(',').map(Number);
  return [Number(s)];
}
/**
 * Read either a single index "1" or a comma separated list of indexes "1,2,3"
 *
 * @throws if any index is not a number;
 */
export function extractIndexNumbers(s: string): number[] {
  const num = parseIndexNumbers(s);
  for (const n of num) if (isNaN(n)) throw new Error('Index is not a number: ' + s);
  return num;
}

/** Convert a path starting with "./" to a absolute path */
function resolvePath(s: string, basePath: string): string {
  if (s.startsWith('./')) return fsa.join(basePath, s.slice(2));
  return s;
}

function extractSourceFiles(item: CogifyStacItem): string[] {
  return item.links.filter((link) => link.rel === 'linz_basemaps:source').map((link) => link.href);
}

function isPathLocal(path: string): boolean {
  return path.startsWith('./') || path.startsWith('/');
}

export const BasemapsCogifyCreateCommand = command({
  name: 'cogify-create',
  version: CliInfo.version,
  description: 'Create a COG from imagery',
  args: {
    ...logArguments,
    path: positional({ type: string, displayName: 'path', description: 'Path to collection.json' }),
    force: flag({ long: 'force', description: 'Overwrite existing tiff files' }),
    index: option({ type: string, long: 'index', description: 'Tiles to create inside of collection' }),
  },

  async handler(args) {
    const logger = getLogger(this, args);

    const jobJsonRaw = await fsa.read(args.path);
    const collection = JSON.parse(jobJsonRaw.toString()) as CogifyStacCollection; // TODO parse this with zod?
    if (collection.stac_version !== '1.0.0') {
      throw new Error(`Invalid Job JSON: ${args.path} stac version number mismatch ${collection.stac_version}`);
    }

    const collectionPath = dirname(args.path);
    const indexes = extractIndexNumbers(args.index);

    const itemLinks = collection.links.filter((f) => f.rel === 'item');
    logger.debug({ items: itemLinks.length, title: collection.title }, 'Stac:Read');

    // Load all stac item JSONs
    const items = await Promise.all(
      indexes.map(async (idx) => {
        const link = itemLinks[idx];
        if (link == null) throw new Error(`index: ${idx} is out of range 0-${itemLinks.length - 1}`);
        const itemPath = resolvePath(link.href, collectionPath);
        logger.info({ href: itemPath }, 'Cog:ReadStac');

        const rawStacItem = await fsa.read(itemPath);
        return JSON.parse(rawStacItem.toString()) as CogifyStacItem;
      }),
    );

    // Determine what files need to be created by looking for the cog asset.
    const toCreate = items.filter((item) => {
      const cogAsset = item.assets['cog'];
      if (cogAsset == null) return true;

      // Force overwrite existing files
      if (args.force) {
        logger.info({ asset: cogAsset.href }, 'Cog:Create:Overwrite');
        return true;
      }

      logger.info({ asset: cogAsset.href }, 'Cog:Create:Exists');
      // TODO check if the tiff file actually exists
      // TODO validate checksum of tiff file?
      return false;
    });

    // Nothing to create exit early
    if (toCreate.length === 0) {
      logger.info('Cog:Exists');
      return;
    }

    // Get list of unique source files needed for all files
    const sourceFiles = new Set<string>();
    for (const i of toCreate) {
      const files = getSources(i.links);
      for (const src of files) sourceFiles.add(src.href);

      const cutline = getCutline(i.links);
      if (cutline) sourceFiles.add(cutline.href);
    }

    // Mapping of remote filename to source filename
    const sourceFileMap = new Map<string, string>();
    const tmpFolder = fsa.join(tmpdir(), CliId);

    try {
      await mkdir(tmpFolder, { recursive: true });

      await Promise.all(
        [...sourceFiles].map(async (f) => {
          // No need to download files that exist locally
          if (isPathLocal(f)) {
            sourceFileMap.set(f, f);
            return;
          }
          // Create a temporary file name that is the base58 encoded path, this allows us to
          const newFileName = sha256base58(Buffer.from(f)) + extname(f);
          const targetFile = fsa.joinAll(tmpFolder, 'source', newFileName);

          logger.debug({ source: f, target: targetFile }, 'Cog:Source:Download');
          const startTime = performance.now();
          await fsa.write(targetFile, fsa.stream(f));
          const duration = performance.now() - startTime;
          logger.debug({ source: f, target: targetFile, duration }, 'Cog:Source:Download:Done');
          sourceFileMap.set(f, targetFile);
        }),
      );

      for (const item of toCreate) {
        const cutlineLink = getCutline(item.links);

        const options = item.properties['linz_basemaps:options'];
        const tileId = TileId.toTileId(options.tile);
        // Location to where the tiff should be stored
        const tiffPath = fsa.join(collectionPath, tileId + '.tiff');
        const itemPath = fsa.join(collectionPath, tileId + '.json');

        const tileMatrix = TileMatrixSets.find(options.tileMatrix);
        if (tileMatrix == null) throw new Error('Failed to find tileMatrix: ' + options.tileMatrix);
        const cutline = await CutlineOptimizer.loadFromLink(cutlineLink, tileMatrix);

        const sourceFiles = extractSourceFiles(item).map((sourcePath) => sourceFileMap.get(sourcePath)) as string[];

        // Create the tiff
        const outputTiffPath = await createCog({ options, tempFolder: tmpFolder, sourceFiles, cutline, logger });
        const asset: StacAsset = {
          href: `./${tileId}.tiff`,
          type: 'image/tiff; application=geotiff; profile=cloud-optimized',
          roles: ['data'],
        };
        item.assets['cog'] = asset;

        const startTime = performance.now();
        const readStream = fsa.stream(outputTiffPath);

        const hash = createHash('sha256');
        readStream.on('data', (chunk) => hash.update(chunk));
        await fsa.write(tiffPath, readStream);
        // Create a multihash, 0x12: sha256, 0x20: 32 characters long
        const digest = '1220' + hash.digest('hex');
        asset['file:checksum'] = digest;
        logger.debug({ target: tiffPath, hash: digest, duration: performance.now() - startTime }, 'Cog:Create:Write');
        await fsa.write(itemPath, JSON.stringify(item, null, 2));
        logger.info({ tileId, tiffPath }, 'Cog:Create:Done');
      }
    } finally {
      // Cleanup the temporary folder once everything is done
      logger.info({ path: tmpFolder }, 'Cog:Cleanup');
      // await rm(tmpFolder, { recursive: true, force: true });
    }
    logger.info(
      {
        count: toCreate.length,
        files: toCreate.map((f) => TileId.toTileId(f.properties['linz_basemaps:options'].tile)),
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
  const tileId = TileId.toTileId(options.tile);

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
