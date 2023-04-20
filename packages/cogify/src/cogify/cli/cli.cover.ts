import { ConfigProviderMemory } from '@basemaps/config';
import { initConfigFromPaths } from '@basemaps/config/build/json/tiff.config.js';
import { GoogleTms, Nztm2000QuadTms, TileId } from '@basemaps/geo';
import { fsa } from '@basemaps/shared';
import { CliId, CliInfo } from '@basemaps/shared/build/cli/info.js';
import { Metrics } from '@linzjs/metrics';
import { command, number, option, optional, restPositionals, string } from 'cmd-ts';
import { CutlineOptimizer } from '../../cutline.js';
import { getLogger, logArguments } from '../../log.js';
import { createTileCover, TileCoverContext } from '../../tile.cover.js';

const SupportedTileMatrix = [GoogleTms, Nztm2000QuadTms];

export const BasemapsCogifyCoverCommand = command({
  name: 'cogify-cover',
  version: CliInfo.version,
  description: 'Create a COG from a covering configuration',
  args: {
    ...logArguments,
    target: option({ type: string, long: 'target', description: 'Where to write the configuration' }),
    cutline: option({ type: optional(string), long: 'cutline', description: 'Cutline to cut tiffs' }),
    cutlineBlend: option({
      type: number,
      long: 'cutline-blend',
      description: 'Cutline blend amount see GDAL_TRANSLATE -cblend',
      defaultValue: () => 20,
    }),
    paths: restPositionals({ type: string, displayName: 'path', description: 'Path to source imagery' }),
    tileMatrix: option({
      type: string,
      long: 'tile-matrix',
      description: `Output TileMatrix to use [${SupportedTileMatrix.map((f) => f.identifier).join(', ')}]`,
    }),
  },
  async handler(args) {
    const metrics = new Metrics();
    const logger = getLogger(this, args);

    const mem = new ConfigProviderMemory();
    metrics.start('imagery:load');
    const cfg = await initConfigFromPaths(mem, args.paths);
    const imageryLoadTime = metrics.end('imagery:load');
    if (cfg.imagery.length === 0) throw new Error('No imagery found');
    const im = cfg.imagery[0];
    logger.info({ files: im.files.length, title: im.title, duration: imageryLoadTime }, 'Imagery:Loaded');

    const tms = SupportedTileMatrix.find((f) => f.identifier.toLowerCase() === args.tileMatrix.toLowerCase());
    if (tms == null) throw new Error('--tile-matrix: ' + args.tileMatrix + ' not found');

    metrics.start('cutline:load');
    const cutline = await CutlineOptimizer.load(args.cutline, args.cutlineBlend, tms);
    const cutlineLoadTime = metrics.end('cutline:load');
    logger.info({ path: args.cutline, duration: cutlineLoadTime }, 'Cutline:Loaded');

    const ctx: TileCoverContext = {
      id: CliId,
      imagery: im,
      tileMatrix: tms,
      logger,
      metrics,
      cutline,
    };

    const res = await createTileCover(ctx);

    const targetPath = fsa.joinAll(args.target, String(tms.projection.code), im.name, CliId);

    const sourcePath = fsa.join(targetPath, 'source.json');
    await fsa.write(sourcePath, JSON.stringify(res.source, null, 2));

    const coveringPath = fsa.join(targetPath, 'covering.json');
    await fsa.write(coveringPath, JSON.stringify({ type: 'FeatureCollection', features: res.items }, null, 2));

    const collectionPath = fsa.join(targetPath, 'collection.json');
    await fsa.write(collectionPath, JSON.stringify(res.collection, null, 2));
    ctx.logger?.debug({ path: collectionPath }, 'Imagery:Stac:Collection:Write');

    const tilesByZoom: number[] = [];
    for (const item of res.items) {
      const tileId = TileId.fromTile(item.properties['linz_basemaps:options'].tile);
      const itemPath = fsa.join(targetPath, `${tileId}.json`);
      await fsa.write(itemPath, JSON.stringify(item, null, 2));
      const z = item.properties['linz_basemaps:options'].tile.z;
      tilesByZoom[z] = (tilesByZoom[z] ?? 0) + 1;
      ctx.logger?.trace({ path: itemPath }, 'Imagery:Stac:Item:Write');
    }

    logger.info({ tiles: res.items.length, metrics: metrics.metrics, tilesByZoom }, 'Cover:Created');
  },
});
