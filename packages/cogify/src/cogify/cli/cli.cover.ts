import { ConfigProviderMemory } from '@basemaps/config';
import { initConfigFromUrls } from '@basemaps/config-loader';
import { GoogleTms, Nztm2000QuadTms, TileId } from '@basemaps/geo';
import { fsa, urlToString } from '@basemaps/shared';
import { CliId, CliInfo } from '@basemaps/shared/build/cli/info.js';
import { Metrics } from '@linzjs/metrics';
import { command, flag, number, oneOf, option, optional, restPositionals, string } from 'cmd-ts';

import { isArgo } from '../../argo.js';
import { CutlineOptimizer } from '../../cutline.js';
import { getLogger, logArguments } from '../../log.js';
import { Presets } from '../../preset.js';
import { createTileCover, TileCoverContext } from '../../tile.cover.js';
import { RgbaType, Url, UrlFolder } from '../parsers.js';
import { createFileStats } from '../stac.js';

const SupportedTileMatrix = [GoogleTms, Nztm2000QuadTms];

// Round gsd to 3 decimals without trailing zero, or integer if larger than 1
export function gsdToMeter(gsd: number): number {
  if (gsd > 1) return Math.round(gsd);
  if (gsd < 0.001) return 0.001;
  return parseFloat(gsd.toFixed(3));
}

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
    baseZoomOffset: option({
      type: optional(number),
      long: 'base-zoom-offset',
      description:
        'Adjust the base zoom level of the output COGS, "-1" reduce the target output resolution by one zoom level',
    }),
    requireStacCollection: flag({
      long: 'require-stac-collection',
      description: 'Require the source dataset to have a STAC collection.json',
      defaultValue: () => false,
      defaultValueIsSerializable: true,
    }),
    background: option({
      type: optional(RgbaType),
      long: 'background',
      description: 'Replace all transparent COG pixels with this RGBA hexstring color',
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

    if (im.collection == null && args.requireStacCollection) {
      throw new Error(`No collection.json found with imagery: ${im.url.href}`);
    }

const slug = im.collection?.['linz:slug']
if (slug != null) im.name = slug

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
      background: args.background,
      targetZoomOffset: args.baseZoomOffset,
    };

    const res = await createTileCover(ctx);

    // Find the dem/dsm prefix for the nz-elevation bucket source and update imagery name to include prefix
    if (im.collection != null) {
      const geoCategory = im.collection['linz:geospatial_category'];
      if (geoCategory === 'dem' || geoCategory === 'dsm') {
        im.name = `${im.name}_${geoCategory}_${gsdToMeter(im.gsd)}m`;
        args.target = new URL('elevation/', args.target);
      }
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
      const tile = item.properties['linz_basemaps:options'].tile;
      if (tile == null) throw new Error('Tile not found in item');
      const tileId = TileId.fromTile(tile);
      const itemPath = new URL(`${tileId}.json`, targetPath);
      items.push({ path: itemPath });
      await fsa.write(itemPath, JSON.stringify(item, null, 2));
      const z = tile.z;
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
