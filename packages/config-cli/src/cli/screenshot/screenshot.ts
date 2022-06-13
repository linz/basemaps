import { Config, fsa, LogConfig, LogType } from '@basemaps/shared';
import { mkdir } from 'fs/promises';
import { Browser, chromium } from 'playwright';
import { CommandLineAction, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { z } from 'zod';
import getPort, { portNumbers } from 'get-port';
import { createServer } from '@basemaps/server';
import { FastifyInstance } from 'fastify/types/instance';
import { ConfigBundled, ConfigProviderMemory } from '@basemaps/config';

export const DefaultTestTiles = './test-tiles/default.test.tiles.json';
export const DefaultHost = 'basemaps.linz.govt.nz';

enum TileMatrixIdentifier {
  Nztm2000Quad = 'NZTM2000Quad',
  Google = 'WebMercatorQuad',
}

const zLocation = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  z: z.number().gte(0).lte(32),
});

const zTileTest = z.object({
  name: z.string(),
  tileMatrix: z.nativeEnum(TileMatrixIdentifier),
  location: zLocation,
  tileSet: z.string(),
  style: z.string().optional(),
});

export type TileTestSchema = z.infer<typeof zTileTest>;

export class CommandScreenShot extends CommandLineAction {
  private config: CommandLineStringParameter;
  private host: CommandLineStringParameter;
  private tiles: CommandLineStringParameter;

  public constructor() {
    super({
      actionName: 'screenshot',
      summary: 'dump screenshots of from LINZ Basemaps',
      documentation: 'Dump screenshots with selected tile sets',
    });
  }

  protected onDefineParameters(): void {
    this.config = this.defineStringParameter({
      argumentName: 'CONFIG',
      parameterLongName: '--config',
      description: 'Path of config bundle file, could be both local file or s3.',
    });

    this.host = this.defineStringParameter({
      argumentName: 'HOST',
      parameterLongName: '--host',
      description: 'Host to use',
      defaultValue: DefaultHost,
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
    const config = this.config.value;
    let host = this.host.value ?? DefaultHost;
    const tiles = this.tiles.value ?? DefaultTestTiles;

    let BasemapsServer: FastifyInstance | undefined = undefined;
    if (config != null) {
      const port = await getPort({ port: portNumbers(10000, 11000) });
      host = `http://localhost:${port}`;
      BasemapsServer = await startServer(host, port, config, logger);
    }

    logger.info('Page:Launch');
    const chrome = await chromium.launch();
    try {
      await takeScreenshots(host, tiles, chrome, logger);
    } finally {
      await chrome.close();
      if (BasemapsServer != null) await BasemapsServer.close();
    }
  }
}

export async function takeScreenshots(host: string, tiles: string, chrome: Browser, logger: LogType): Promise<void> {
  const TestTiles = await fsa.readJson<TileTestSchema[]>(tiles);
  for (const test of TestTiles) {
    const page = await chrome.newPage();

    const searchParam = new URLSearchParams();
    searchParam.set('p', test.tileMatrix);
    searchParam.set('i', test.tileSet);
    if (test.style) searchParam.set('s', test.style);

    const loc = `@${test.location.lat},${test.location.lng},z${test.location.z}`;
    const fileName = '.artifacts/visual-snapshots/' + host + '_' + test.name + '.png';

    await mkdir(`.artifacts/visual-snapshots/`, { recursive: true });

    let url = `${host}/?${searchParam.toString()}&debug=true&debug.screenshot=true#${loc}`;
    if (!url.startsWith('http')) url = `https"//${url}`;

    logger.info({ url, expected: fileName }, 'Page:Load');

    await page.goto(url);

    try {
      await page.waitForSelector('div#map-loaded', { state: 'attached' });
      await page.waitForTimeout(1000);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: fileName });
    } catch (e) {
      await page.screenshot({ path: fileName });
      throw e;
    }
    logger.info({ url, expected: fileName }, 'Page:Load:Done');
    await page.close();
  }
}

async function startServer(host: string, port: number, config: string, logger: LogType): Promise<FastifyInstance> {
  // Bundle Config
  const configJson = await fsa.readJson<ConfigBundled>(config);
  const mem = ConfigProviderMemory.fromJson(configJson);
  Config.setConfigProvider(mem);

  // Start server
  const server = createServer(logger);
  await new Promise<void>((resolve) =>
    server.listen(port, '0.0.0.0', () => {
      logger.info({ url: host }, 'ServerStarted');
      resolve();
    }),
  );
  return server;
}
