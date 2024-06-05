import { ConfigProviderMemory } from '@basemaps/config';
import { initConfigFromUrls } from '@basemaps/config-loader';
import { GoogleTms, Nztm2000QuadTms, TileId } from '@basemaps/geo';
import { fsa, urlToString } from '@basemaps/shared';
import { CliId, CliInfo } from '@basemaps/shared/build/cli/info.js';
import { Metrics } from '@linzjs/metrics';
import { command, number, oneOf, option, optional, restPositionals, string } from 'cmd-ts';

import { isArgo } from '../../argo.js';
import { CutlineOptimizer } from '../../cutline.js';
import { getLogger, logArguments } from '../../log.js';
import { Presets } from '../../preset.js';
import { createTileCover, TileCoverContext } from '../../tile.cover.js';
import { Url, UrlFolder } from '../parsers.js';
import { createFileStats } from '../stac.js';

const SupportedTileMatrix = [GoogleTms, Nztm2000QuadTms];

export const BasemapsCogifyCoverCommand = command({
  name: 'cogify-cover',
  version: CliInfo.version,
  description: 'Create a covering configuration from a collection from source imagery',
  args: {
    ...logArguments,
    target: option({ type: UrlFolder, long: 'target', description: 'Where to write the configuration' }),
    cutline: option({ type: optional(Url), long: 'cutline', description: 'Cutline to cut tiffs' }),
    cutlineBlend: option({
      type: number,
      long: 'cutline-blend',
      description: 'Cutline blend amount see GDAL_TRANSLATE -cblend',
      defaultValue: () => 20,
    }),
    paths: restPositionals({ type: UrlFolder, displayName: 'path', description: 'Path to source imagery' }),
    preset: option({
      type: oneOf(Object.keys(Presets)),
      long: 'preset',
      description: 'GDAL compression preset',
      defaultValue: () => 'webp',
      defaultValueIsSerializable: true,
    }),
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
    const cfg = await initConfigFromUrls(mem, args.paths);
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
      preset: args.preset,
    };

    const res = await createTileCover(ctx);

    // Find the dem/dsm prefix for the nz-elevation bucket source and update imagery name to include prefix
    if (im.url.hostname === 'nz-elevation') {
      const prefix = im.url.pathname.split('/')[3];
      if (!(prefix.includes('dem') || prefix.includes('dsm'))) {
        throw new Error(`Invalid source path from nz-elevation bucket: ${im.url.href}`);
      }
      im.name = `${im.name}_${prefix}`;
    }
    const targetPath = new URL(`${tms.projection.code}/${im.name}/${CliId}/`, args.target);

    const sourcePath = new URL('source.geojson', targetPath);
    const sourceData = JSON.stringify(res.source, null, 2);
    await fsa.write(sourcePath, sourceData);

    const coveringPath = new URL('covering.geojson', targetPath);
    const coveringData = JSON.stringify({ type: 'FeatureCollection', features: res.items }, null, 2);
    await fsa.write(coveringPath, coveringData);

    res.collection.assets = res.collection.assets ?? {};
    res.collection.assets['covering'] = {
      title: 'GeoJSON FeatureCollection of output',
      href: './covering.geojson',
      ...createFileStats(coveringData),
    };
    res.collection.assets['source'] = {
      title: 'GeoJSON FeatureCollection of all source files used',
      href: './source.geojson',
      ...createFileStats(sourceData),
    };

    const collectionPath = new URL('collection.json', targetPath);
    await fsa.write(collectionPath, JSON.stringify(res.collection, null, 2));
    ctx.logger?.debug({ path: collectionPath }, 'Imagery:Stac:Collection:Write');

    const items = [];
    const tilesByZoom: number[] = [];
    for (const item of res.items) {
      const tileId = TileId.fromTile(item.properties['linz_basemaps:options'].tile);
      const itemPath = new URL(`${tileId}.json`, targetPath);
      items.push({ path: itemPath });
      await fsa.write(itemPath, JSON.stringify(item, null, 2));
      const z = item.properties['linz_basemaps:options'].tile.z;
      tilesByZoom[z] = (tilesByZoom[z] ?? 0) + 1;
      ctx.logger?.trace({ path: itemPath }, 'Imagery:Stac:Item:Write');
    }

    // If running in argo dump out output information to be used by further steps
    if (isArgo()) {
      // Where the JSON files were written to
      await fsa.write(fsa.toUrl('/tmp/cogify/cover-target'), urlToString(targetPath));
      // Title of the imagery
      await fsa.write(fsa.toUrl('/tmp/cogify/cover-title'), ctx.imagery.title);
      // List of all the tiles to be processed
      await fsa.write(fsa.toUrl('/tmp/cogify/cover-items.json'), JSON.stringify(items));
    }

    logger.info({ tiles: res.items.length, metrics: metrics.metrics, tilesByZoom }, 'Cover:Created');
  },
});
