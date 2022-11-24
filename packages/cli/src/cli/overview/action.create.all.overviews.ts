import { ConfigBundled } from '@basemaps/config';
import { getDefaultConfig, LogConfig } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import {
  CommandLineAction,
  CommandLineFlagParameter,
  CommandLineIntegerParameter,
  CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { invalidateCache } from '../util.js';
import { createOverview, DefaultMaxZoom } from './action.create.overview.js';

export class CommandCreateAllOverviews extends CommandLineAction {
  private config: CommandLineStringParameter;
  private maxZoom: CommandLineIntegerParameter;
  private force: CommandLineFlagParameter;
  private commit: CommandLineFlagParameter;

  invalidations: string[] = [];

  public constructor() {
    super({
      actionName: 'create-all-overviews',
      summary: 'Create overviews for all the imagery in the config',
      documentation: 'Given a config.json and then create overviews for all the imagery within a maximum zoom level.',
    });
  }

  protected onDefineParameters(): void {
    this.config = this.defineStringParameter({
      argumentName: 'CONFIG',
      parameterLongName: '--config',
      description: 'Path of config.json',
      required: true,
    });
    this.maxZoom = this.defineIntegerParameter({
      argumentName: 'MAX_ZOOM',
      parameterLongName: '--max-zoom',
      description: 'Maximum zoom level for the overview',
    });
    this.force = this.defineFlagParameter({
      parameterLongName: '--force',
      description: 'Force to recreate overview for all imagery.',
      required: false,
    });
    this.commit = this.defineFlagParameter({
      parameterLongName: '--commit',
      description: 'Actually start the create overview',
      required: false,
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const config = this.config.value;
    if (config == null) throw new Error('Please provide a config json');
    const maxZoom = this.maxZoom.value ?? DefaultMaxZoom;
    const force = this.force.value;
    const commit = this.commit.value;
    const cfg = getDefaultConfig();

    logger.info({ config, maxZoom, force }, 'CreateOverview:LoadConfig');
    const configJson = await fsa.readJson<ConfigBundled>(config);
    for (const imagery of configJson.imagery) {
      if (imagery.overviews != null) {
        logger.info({ imagery: imagery.name, projection: imagery.projection }, 'CreateOverview:Exist');
        if (!force) continue;
      }
      if (commit) {
        await createOverview(imagery.uri, maxZoom, logger, imagery.uri);
        imagery.overviews = { path: '/overviews.tar.co', minZoom: 0, maxZoom };

        logger.info({ imagery: imagery.name, projection: imagery.projection }, 'CreateOverview:WriteImageryConfig');
        if (cfg.Imagery.isWriteable()) {
          await cfg.Imagery.put(imagery);
          this.invalidations.push(imagery.id);
        }
      }
    }

    if (commit && this.invalidations.length > 0) {
      // Lots of invalidations just invalidate everything
      if (this.invalidations.length > 10) {
        await invalidateCache('/*', commit);
      } else {
        await invalidateCache(this.invalidations, commit);
      }
    }

    if (!this.commit.value) logger.info({ config, maxZoom, force }, 'CreateOverview:DryRun');
    logger.info({ config, maxZoom, force }, 'CreateOverview:Done');
  }
}
