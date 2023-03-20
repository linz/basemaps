import {
  BaseConfig,
  BasemapsConfigProvider,
  ConfigBundle,
  ConfigBundled,
  ConfigId,
  ConfigPrefix,
  ConfigProviderMemory,
  standardizeLayerName,
} from '@basemaps/config';
import { GoogleTms, Nztm2000QuadTms, TileMatrixSet } from '@basemaps/geo';
import { Env, fsa, getDefaultConfig, LogConfig, Projection } from '@basemaps/shared';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import fetch from 'node-fetch';
import { CogStacJob } from '../../cog/cog.stac.job.js';
import { invalidateCache } from '../util.js';
import { Q, Updater } from './config.update.js';

const PublicUrlBase = Env.isProduction() ? 'https://basemaps.linz.govt.nz/' : 'https://dev.basemaps.linz.govt.nz/';

const VectorStyles = ['topographic', 'topolite', 'aerialhybrid']; // Vector styles that we want to review if vector data changes.

export class CommandImport extends CommandLineAction {
  private config: CommandLineStringParameter;
  private backup: CommandLineStringParameter;
  private output: CommandLineStringParameter;
  private commit: CommandLineFlagParameter;

  promises: Promise<boolean>[] = [];
  /** List of paths to invalidate at the end of the request */
  invalidations: string[] = [];

  /** List of changed config ids */
  changes: string[] = [];

  /** List of paths to invalidate at the end of the request */
  backupConfig: ConfigProviderMemory = new ConfigProviderMemory();

  public constructor() {
    super({
      actionName: 'import',
      summary: 'import a config json into dynamodb',
      documentation: 'Given a valid bundle config json and import them into dynamodb',
    });
  }

  protected onDefineParameters(): void {
    this.config = this.defineStringParameter({
      argumentName: 'CONFIG',
      parameterLongName: '--config',
      description: 'Path of config json, this can be both a local path or s3 location',
      required: true,
    });
    this.backup = this.defineStringParameter({
      argumentName: 'BACKUP',
      parameterLongName: '--backup',
      description: 'Backup the old config into a config bundle json',
    });
    this.output = this.defineStringParameter({
      argumentName: 'OUTPUT',
      parameterLongName: '--output',
      description: 'Output a markdown file with the config changes',
    });
    this.commit = this.defineFlagParameter({
      parameterLongName: '--commit',
      description: 'Actually start the import',
      required: false,
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const commit = this.commit.value ?? false;
    const config = this.config.value;
    const backup = this.backup.value;
    const cfg = getDefaultConfig();
    if (config == null) throw new Error('Please provide a config json');
    if (commit && !config.startsWith('s3://') && Env.isProduction()) {
      throw new Error('To actually import into dynamo has to use the config file from s3.');
    }

    const HostPrefix = Env.isProduction() ? '' : 'dev.';
    const healthEndpoint = `https://${HostPrefix}basemaps.linz.govt.nz/v1/health`;

    logger.info({ url: healthEndpoint }, 'Import:ValidateHealth');
    if (commit) {
      const res = await fetch(healthEndpoint);
      if (!res.ok) throw new Error('Cannot update basemaps is unhealthy');
    }

    logger.info({ config }, 'Import:Load');
    const configJson = await fsa.readJson<ConfigBundled>(config);
    const mem = ConfigProviderMemory.fromJson(configJson);
    mem.createVirtualTileSets();

    logger.info({ config }, 'Import:Start');
    for (const config of mem.objects.values()) this.update(config, commit);
    await Promise.all(this.promises);

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
      }
    }

    if (commit && this.invalidations.length > 0) {
      // Lots of invalidations just invalidate everything
      if (this.invalidations.length > 10) {
        await invalidateCache('/*', commit);
      } else {
        await invalidateCache(this.invalidations, commit);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const res = await fetch(healthEndpoint);
      if (!res.ok) throw new Error('Basemaps is unhealthy');
    }

    if (backup) {
      await fsa.writeJson(backup, this.backupConfig.toJson());
    }

    const output = this.output.value;
    if (output) await this.outputChange(output, mem, cfg);

    if (commit !== true) logger.info('DryRun:Done');
  }

  update(config: BaseConfig, commit: boolean): void {
    const promise = Q(async (): Promise<boolean> => {
      const updater = new Updater(config, commit);

      const hasChanges = await updater.reconcile();
      if (hasChanges) {
        this.changes.push(config.id);
        this.invalidations.push(updater.invalidatePath());
        const oldData = await updater.getOldData();
        if (oldData != null) this.backupConfig.put(oldData); // No need to backup anything if there is new insert
      } else {
        this.backupConfig.put(config);
      }
      return true;
    });

    this.promises.push(promise);
  }

  async outputChange(output: string, mem: BasemapsConfigProvider, cfg: BasemapsConfigProvider): Promise<void> {
    // Output for aerial config changes
    const inserts: string[] = ['# New Layers\n'];
    const updates: string[] = ['# Updates\n'];
    const aerialId = 'ts_aerial';
    const newData = await mem.TileSet.get(aerialId);
    const oldData = await cfg.TileSet.get(aerialId);
    if (newData == null || oldData == null) throw new Error('Failed to fetch aerial config data.');
    for (const layer of newData.layers) {
      if (layer.name === 'chatham-islands_digital-globe_2014-2019_0-5m') continue; // Ignore duplicated layer.
      const existing = oldData.layers.find((l) => l.name === layer.name);
      if (existing) {
        let zoom = undefined;
        if (layer.minZoom !== existing.minZoom || layer.maxZoom !== existing.maxZoom) {
          zoom = ' - Zoom level updated.';
          if (layer.minZoom !== existing.minZoom) zoom += ` min zoom ${existing.minZoom} -> ${layer.minZoom}`;
          if (layer.maxZoom !== existing.maxZoom) zoom += ` max zoom ${existing.maxZoom} -> ${layer.maxZoom}`;
        }

        const change: string[] = [`### ${layer.name}\n`];
        if (layer[2193]) {
          const urls = await this.prepareUrl(layer[2193], mem, Nztm2000QuadTms);
          if (layer[2193] !== existing[2193]) {
            change.push(`- Layer update [NZTM2000Quad](${urls.layer}) -- [Aerial](${urls.tag})\n`);
          }
          if (zoom) zoom += ` [NZTM2000Quad](${urls.tag})`;
        }
        if (layer[3857]) {
          const urls = await this.prepareUrl(layer[3857], mem, GoogleTms);
          if (layer[3857] !== existing[3857]) {
            change.push(`- Layer update [WebMercatorQuad](${urls.layer}) -- [Aerial](${urls.tag})\n`);
          }
          if (zoom) zoom += ` [WebMercatorQuad](${urls.tag})`;
        }

        if (zoom) change.push(`${zoom}\n`);
        if (change.length > 1) updates.push(change.join(''));
      } else {
        // New layers
        inserts.push(`### ${layer.name}\n`);
        if (layer[2193]) {
          const urls = await this.prepareUrl(layer[2193], mem, Nztm2000QuadTms);
          inserts.push(` - [NZTM2000Quad](${urls.layer}) -- [Aerial](${urls.tag})\n`);
        }
        if (layer[3857]) {
          const urls = await this.prepareUrl(layer[3857], mem, GoogleTms);
          inserts.push(` - [WebMercatorQuad](${urls.layer}) -- [Aerial](${urls.tag})\n`);
        }
      }
    }

    // Output for vector config changes
    const vectorUpdate = ['# Vector Data Update\n'];
    const styleUpdate = ['# Vector Style Update\n'];
    for (const change of this.changes) {
      if (change === 'ts_topographic') {
        for (const style of VectorStyles) {
          vectorUpdate.push(
            `* [${style}](${PublicUrlBase}?config=${this.config.value}&i=topographic&s=${style}&debug)\n`,
          );
        }
      }
      if (change.startsWith(ConfigPrefix.Style)) {
        const style = ConfigId.unprefix(ConfigPrefix.Style, change);
        styleUpdate.push(`* [${style}](${PublicUrlBase}?config=${this.config.value}&i=topographic&s=${style}&debug)\n`);
      }
    }
    let md = '';
    if (inserts.length > 1) md += inserts.join('');
    if (updates.length > 1) md += updates.join('');
    if (vectorUpdate.length > 1) md += vectorUpdate.join('');
    if (styleUpdate.length > 1) md += styleUpdate.join('');

    if (md !== '') await fsa.write(output, md);

    return;
  }

  _jobs: Map<string, CogStacJob> = new Map<string, CogStacJob>();
  async _loadJob(path: string): Promise<CogStacJob> {
    const existing = this._jobs.get(path);
    if (existing) return existing;
    const job = await fsa.readJson<CogStacJob>(path);
    this._jobs.set(path, job);
    return job;
  }

  /**
   * Prepare QA urls with center location
   */
  async prepareUrl(
    id: string,
    mem: BasemapsConfigProvider,
    tileMatrix: TileMatrixSet,
  ): Promise<{ layer: string; tag: string }> {
    const configImagey = await mem.Imagery.get(id);
    if (configImagey == null) throw new Error(`Failed to find imagery config from config bundel file. Id: ${id}`);
    const job = await this._loadJob(fsa.join(configImagey.uri, 'job.json'));
    const bounds = configImagey.bounds;
    const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    const proj = Projection.get(configImagey.projection);
    const centerLatLon = proj.toWgs84([center.x, center.y]).map((c) => c.toFixed(6));
    const targetZoom = Math.max(tileMatrix.findBestZoom(job.output.gsd) - 12, 0);
    const name = standardizeLayerName(job.name);
    const urls = {
      layer: `${PublicUrlBase}?config=${this.config.value}&i=${name}&p=${tileMatrix.identifier}&debug#@${centerLatLon[1]},${centerLatLon[0]},z${targetZoom}`,
      tag: `${PublicUrlBase}?config=${this.config.value}&p=${tileMatrix.identifier}&debug#@${centerLatLon[1]},${centerLatLon[0]},z${targetZoom}`,
    };
    return urls;
  }
}
