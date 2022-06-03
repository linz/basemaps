import { Config, fsa, LogConfig } from '@basemaps/shared';
import { chromium } from 'playwright';
import { CommandLineAction, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { DefaultTestTiles, takeScreenshots } from './screenshot.js';
import { createServer } from '@basemaps/server';
import { ConfigProviderMemory } from '@basemaps/config';
import { ConfigBundled } from '@basemaps/config/build/memory/memory.config';

export class CommandScreenShotServer extends CommandLineAction {
  private config: CommandLineStringParameter;
  private tiles: CommandLineStringParameter;

  public constructor() {
    super({
      actionName: 'screenshot-server',
      summary: 'Deploy a temporary Basemaps server and dump screenshots',
      documentation: 'Deploy a temporary Basemaps server and dump screenshots with selected tile sets',
    });
  }

  protected onDefineParameters(): void {
    this.config = this.defineStringParameter({
      argumentName: 'CONFIG',
      parameterLongName: '--config',
      description: 'Path of config bundle file, could be both local file or s3.',
      required: true,
    });

    this.tiles = this.defineStringParameter({
      argumentName: 'TILES',
      parameterLongName: '--tiles',
      description: 'JSON file path for the test tiles',
      defaultValue: DefaultTestTiles,
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    logger.info('Page:Launch');
    const config = this.config.value;
    const tiles = this.tiles.value ?? this.tiles.defaultValue;
    if (config == null) throw new Error('Please specify a correct config file for the server.');
    if (tiles == null) throw new Error('Test tiles not defined.');

    // Bundle Config
    const configJson = await fsa.readJson<ConfigBundled>(config);
    const mem = ConfigProviderMemory.fromJson(configJson);
    Config.setConfigProvider(mem);

    // Create a basemaps server.
    const port = 5000;
    const ServerUrl = `http://localhost:${port}`;
    const BasemapsServer = createServer(logger);
    BasemapsServer.listen(port, '0.0.0.0', () => {
      logger.info({ url: ServerUrl }, 'ServerStarted');
    });

    const chrome = await chromium.launch();
    try {
      await takeScreenshots(ServerUrl, 'production', tiles, chrome, logger);
    } finally {
      await chrome.close();
      await BasemapsServer.close();
    }
  }
}
