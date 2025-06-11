import {
  BaseConfig,
  BasemapsConfigProvider,
  ConfigBundle,
  ConfigBundled,
  ConfigId,
  ConfigLayer,
  ConfigPrefix,
  ConfigProviderMemory,
  TileSetType,
} from '@basemaps/config';
import { GoogleTms, Nztm2000QuadTms, TileMatrixSet } from '@basemaps/geo';
import {
  Env,
  fsa,
  getDefaultConfig,
  getLogger,
  getPreviewUrl,
  logArguments,
  LogType,
  setDefaultConfig,
} from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { command, flag, option, optional, string } from 'cmd-ts';
import fetch from 'node-fetch';

import { invalidateCache } from '../util.js';
import { diffVectorUpdate } from './config.diff.js';
import { Q, Updater } from './config.update.js';

const PublicUrlBase = Env.isProduction() ? 'https://basemaps.linz.govt.nz/' : 'https://dev.basemaps.linz.govt.nz/';

const VectorStyles = ['topographic', 'topolite', 'aerialhybrid']; // Vector styles that we want to review if vector data changes.

export const ImportCommand = command({
  name: 'import',
  version: CliInfo.version,
  description: 'Given a valid bundle config json, import them into dynamodb',
  args: {
    ...logArguments,
    config: option({
      type: string,
      long: 'config',
      description: 'Path of config json, this can be both a local path or s3 location',
    }),
    output: option({
      type: optional(string),
      long: 'output',
      description: 'Output a markdown file with the config changes',
    }),
    target: option({
      type: optional(string),
      long: 'target',
      description: 'Target config file to compare',
    }),
    commit: flag({
      long: 'commit',
      description: 'Actually start the import',
      defaultValue: () => false,
      defaultValueIsSerializable: true,
    }),
  },

  async handler(args): Promise<void> {
    const logger = getLogger(this, args, 'cli-config');
    const commit = args.commit;
    const config = args.config;

    if (config == null) throw new Error('Please provide a config json');
    if (commit && !config.startsWith('s3://') && Env.isProduction()) {
      throw new Error('To actually import into dynamo has to use the config file from s3.');
    }

    const configUrl = fsa.toUrl(config);

    const cfg = await getConfig(logger, args.target);

    const HostPrefix = Env.isProduction() ? '' : 'dev.';
    const healthEndpoint = `https://${HostPrefix}basemaps.linz.govt.nz/v1/health`;

    logger.info({ url: healthEndpoint }, 'Import:ValidateHealth');
    if (commit) {
      const res = await fetch(healthEndpoint);
      if (!res.ok) throw new Error('Cannot update basemaps is unhealthy');
    }

    logger.info({ config }, 'Import:Load');
    const configJson = await fsa.readJson<ConfigBundled>(configUrl);
    const mem = ConfigProviderMemory.fromJson(configJson);
    mem.createVirtualTileSets();

    logger.info({ config }, 'Import:Start');
    const objectTypes: Partial<Record<ConfigPrefix, number>> = {};
    for (const config of mem.objects.values()) {
      const objectType = ConfigId.getPrefix(config.id);
      if (objectType) {
        objectTypes[objectType] = (objectTypes[objectType] ?? 0) + 1;
      }
      update(config, cfg, commit);
    }
    await Promise.all(promises);

    logger.info({ objects: mem.objects.size, types: objectTypes }, 'Import:Compare:Done');

    if (commit) {
      const configBundle: ConfigBundle = {
        id: cfg.ConfigBundle.id(configJson.hash),
        name: cfg.ConfigBundle.id(`config-${configJson.hash}.json`),
        path: config,
        hash: configJson.hash,
        assets: configJson.assets,
      };
      logger.info({ config }, 'Import:ConfigBundle');

      if (cfg.ConfigBundle.isWriteable()) {
        // Insert a cb_hash record for reference
        await cfg.ConfigBundle.put(configBundle);
        // Update the cb_latest record
        configBundle.id = cfg.ConfigBundle.id('latest');
        await cfg.ConfigBundle.put(configBundle);
      } else {
        logger.error('Import:NotWriteable');
      }
    }

    if (commit && invalidations.length > 0) {
      // Lots of invalidations just invalidate everything
      if (invalidations.length > 10) {
        await invalidateCache('/*', commit);
      } else {
        await invalidateCache(invalidations, commit);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const res = await fetch(healthEndpoint);
      if (!res.ok) throw new Error('Basemaps is unhealthy');
    }

    const output = args.output;
    if (output != null) await outputChange(output, mem, cfg, config);

    if (commit !== true) logger.info('DryRun:Done');
  },
});

async function getConfig(logger: LogType, target?: string): Promise<BasemapsConfigProvider> {
  if (target) {
    logger.info({ config: target }, 'Import:Target:Load');
    const configJson = await fsa.readJson<ConfigBundled>(fsa.toUrl(target));
    const mem = ConfigProviderMemory.fromJson(configJson);
    mem.createVirtualTileSets();

    setDefaultConfig(mem);
    return mem;
  }
  return getDefaultConfig();
}

const promises: Promise<boolean>[] = [];
/** List of paths to invalidate at the end of the request */
const invalidations: string[] = [];

/** List of changed config */
const changes: BaseConfig[] = [];

/** List of paths to invalidate at the end of the request */
const backupConfig: ConfigProviderMemory = new ConfigProviderMemory();

function update(config: BaseConfig, oldConfig: BasemapsConfigProvider, commit: boolean): void {
  const promise = Q(async (): Promise<boolean> => {
    const updater = new Updater(config, oldConfig, commit);

    const hasChanges = await updater.reconcile();
    if (hasChanges) {
      changes.push(config);
      invalidations.push(updater.invalidatePath());
      const oldData = await updater.getOldData();
      if (oldData != null) backupConfig.put(oldData); // No need to backup anything if there is new insert
    } else {
      backupConfig.put(config);
    }
    return true;
  });

  promises.push(promise);
}

/**
 * This function compared new config with existing and output a markdown document to highlight the inserts and changes
 * Changes includes
 * - aerial config
 * - vector config
 * - vector style
 * - individual config
 *
 * @param output a string of output markdown location
 * @param mem new config data read from config bundle file
 * @param cfg existing config data
 * @param configPath path of config json
 */
async function outputChange(
  output: string,
  mem: ConfigProviderMemory,
  cfg: BasemapsConfigProvider,
  configPath: string,
): Promise<void> {
  const md: string[] = [];
  // Output for aerial config changes
  const inserts: string[] = [];
  const updates: string[] = [];
  const aerialId = 'ts_aerial';
  const newData = await mem.TileSet.get(aerialId);
  const oldData = await cfg.TileSet.get(aerialId);

  const aerialLayers: Set<string> = new Set<string>();
  if (newData == null || oldData == null) throw new Error('Failed to fetch aerial config data.');

  for (const layer of newData.layers) {
    // if (aerialLayers.has(layer.name)) continue;

    aerialLayers.add(layer.name);

    // There are duplicates layers inside the config this makes it hard to know what has changed
    // so only allow comparisons to one layer at a time
    const index = oldData.layers.findIndex((l) => l.name === layer.name);
    if (index > -1) {
      const [el] = oldData.layers.splice(index, 1);
      await outputUpdatedLayers(mem, layer, el, updates, configPath, true);
    } else await outputNewLayers(mem, layer, inserts, configPath, true);
  }

  if (inserts.length > 0) md.push('# Aerial Imagery Inserts', ...inserts);
  if (updates.length > 0) md.push('# Aerial Imagery Updates', ...updates);

  // Some layers were not removed from the old config so they no longer exist in the new config
  if (oldData.layers.length > 0) {
    md.push('# Aerial Imagery Deletes', ...oldData.layers.map((m) => `- ${m.title}`));
  }

  // Output for individual tileset config changes or inserts
  const individualInserts: string[] = [];
  const individualUpdates: string[] = [];
  for (const config of mem.objects.values()) {
    if (!mem.TileSet.is(config)) continue;
    if (config.id === 'ts_aerial') continue;

    if (aerialLayers.has(config.name)) continue;
    if (config.type === TileSetType.Vector) continue;
    if (config.layers.length > 1) continue; // Not an individual layer
    const existing = await cfg.TileSet.get(config.id);
    const layer = config.layers[0];
    if (existing) await outputUpdatedLayers(mem, layer, existing.layers[0], individualUpdates, configPath);
    else await outputNewLayers(mem, layer, individualInserts, configPath);
  }

  if (individualInserts.length > 0) md.push('# Individual Inserts', ...individualInserts);
  if (individualUpdates.length > 0) md.push('# Individual Updates', ...individualUpdates);

  // Output for vector config changes
  const vectorUpdate = [];
  const styleUpdate = [];
  for (const change of changes) {
    if (mem.TileSet.is(change) && change.type === TileSetType.Vector) {
      vectorUpdate.push(`## Vector data updates for ${change.id}`);
      const id = ConfigId.unprefix(ConfigPrefix.TileSet, change.id);
      for (const style of VectorStyles) {
        vectorUpdate.push(`* [${style} - ${id}](${PublicUrlBase}?config=${configPath}&i=${id}&s=${style}&debug)\n`);
      }
      const existingTileSet = await cfg.TileSet.get(change.id);
      const featureChanges = await diffVectorUpdate(change, existingTileSet);
      vectorUpdate.push(`## Feature updates for ${change.id}`);
      vectorUpdate.push(...featureChanges);
    }
    if (mem.Style.is(change)) {
      styleUpdate.push(`## Vector Style updated for ${change.id}`);
      const style = ConfigId.unprefix(ConfigPrefix.Style, change.id);
      styleUpdate.push(`* [${style}](${PublicUrlBase}?config=${configPath}&i=topographic&s=${style}&debug)\n`);
    }
  }

  if (styleUpdate.length > 0) md.push('# Vector Style Update', ...styleUpdate);
  if (vectorUpdate.length > 0) {
    md.push('# Vector Data Update', ...vectorUpdate);

    const layerPath = (await mem.TileSet.get('ts_topographic-v2'))?.layers?.[0]?.[3857];
    if (layerPath) {
      const reportPath = layerPath.substring(0, layerPath.lastIndexOf('/')) + '/report.md';
      const reportFile = await fsa.read(fsa.toUrl(reportPath));
      if (reportFile) {
        md.push(reportFile.toString());
      }
    }
  }

  if (md.length > 0) {
    await fsa.write(fsa.toUrl(output), md.join('\n'));
  }

  return;
}

/**
 * This function prepare for the markdown lines with preview urls for new inserted config layers
 * @param mem new config data read from config bundle file
 * @param layer new config tileset layer
 * @param inserts string array to save all the lines for markdown output
 * @param configPath path of config json
 * @param aerial output preview link for aerial map
 */
async function outputNewLayers(
  mem: ConfigProviderMemory,
  layer: ConfigLayer,
  inserts: string[],
  configPath: string,
  aerial?: boolean,
): Promise<void> {
  inserts.push(`\n### ${layer.name}\n`);
  if (layer[2193]) {
    const urls = await prepareUrl(layer[2193], mem, Nztm2000QuadTms, configPath);
    inserts.push(` - [NZTM2000Quad](${urls.layer})`);
    if (aerial) inserts.push(` - [Aerial](${urls.tag})`);
  }
  if (layer[3857]) {
    const urls = await prepareUrl(layer[3857], mem, GoogleTms, configPath);
    inserts.push(` - [WebMercatorQuad](${urls.layer})`);
    if (aerial) inserts.push(` - [Aerial](${urls.tag})`);
  }
}

/**
 * This function compared new config tileset layer with existing one, then output the markdown lines for updates and preview urls.
 * @param mem new config data read from config bundle file
 * @param layer new config tileset layer
 * @param existing existing config tileset layer
 * @param updates string array to save all the lines for markdown output
 * @param configPath path of config json
 * @param aerial output preview link for aerial map
 */
async function outputUpdatedLayers(
  mem: ConfigProviderMemory,
  layer: ConfigLayer,
  existing: ConfigLayer,
  updates: string[],
  configPath: string,
  aerial?: boolean,
): Promise<void> {
  let zoom = undefined;
  if (layer.minZoom !== existing.minZoom || layer.maxZoom !== existing.maxZoom) {
    zoom = ' - Zoom level updated.';
    if (layer.minZoom !== existing.minZoom) zoom += ` min zoom ${existing.minZoom} -> ${layer.minZoom}`;
    if (layer.maxZoom !== existing.maxZoom) zoom += ` max zoom ${existing.maxZoom} -> ${layer.maxZoom}`;
  }

  const change: string[] = [`\n### ${layer.name}\n`];
  if (layer[2193]) {
    if (layer[2193] !== existing[2193]) {
      const urls = await prepareUrl(layer[2193], mem, Nztm2000QuadTms, configPath);
      change.push(`- Layer update [NZTM2000Quad](${urls.layer})`);
      if (aerial) updates.push(` - [Aerial](${urls.tag})`);
    }

    if (zoom) {
      const urls = await prepareUrl(layer[2193], mem, Nztm2000QuadTms, configPath);
      zoom += ` [NZTM2000Quad](${urls.tag})`;
    }
  }
  if (layer[3857]) {
    if (layer[3857] !== existing[3857]) {
      const urls = await prepareUrl(layer[3857], mem, GoogleTms, configPath);
      change.push(`- Layer update [WebMercatorQuad](${urls.layer})`);
      if (aerial) updates.push(` - [Aerial](${urls.tag})`);
    }

    if (zoom) {
      const urls = await prepareUrl(layer[3857], mem, GoogleTms, configPath);
      zoom += ` [WebMercatorQuad](${urls.tag})`;
    }
  }

  if (zoom) change.push(`${zoom}\n`);
  if (change.length > 1) updates.push(change.join(''));
}

/**
 * Prepare QA urls with center location
 */
async function prepareUrl(
  id: string,
  mem: BasemapsConfigProvider,
  tileMatrix: TileMatrixSet,
  configPath: string,
): Promise<{ layer: string; tag: string }> {
  const configImagery = await mem.Imagery.get(id);
  if (configImagery == null) throw new Error(`Failed to find imagery config from config bundle file. Id: ${id}`);

  const center = getPreviewUrl({ imagery: configImagery });
  const urls = {
    layer: `${PublicUrlBase}?config=${configPath}&i=${center.name}&p=${tileMatrix.identifier}&debug#@${center.location.lat},${center.location.lon},z${center.location.zoom}`,
    tag: `${PublicUrlBase}?config=${configPath}&p=${tileMatrix.identifier}&debug#@${center.location.lat},${center.location.lon},z${center.location.zoom}`,
  };
  return urls;
}
