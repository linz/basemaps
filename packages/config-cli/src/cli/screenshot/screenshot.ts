import { Config, fsa, LogConfig, LogType } from '@basemaps/shared';
import { mkdir } from 'fs/promises';
import { Browser, chromium } from 'playwright';
import { CommandLineAction, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { z } from 'zod';

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
  private host: CommandLineStringParameter;
  private tag: CommandLineStringParameter;
  private tiles: CommandLineStringParameter;

  public constructor() {
    super({
      actionName: 'screenshot',
      summary: 'dump screenshots of from LINZ Basemaps',
      documentation: 'Dump screenshots with selected tile sets',
    });
  }

  protected onDefineParameters(): void {
    this.host = this.defineStringParameter({
      argumentName: 'HOST',
      parameterLongName: '--host',
      description: 'Host to use',
      defaultValue: 'basemaps.linz.govt.nz',
    });

    this.tag = this.defineStringParameter({
      argumentName: 'TAG',
      parameterShortName: '-t',
      parameterLongName: '--tag',
      description: 'PR tag(PR-number) or "production"',
      defaultValue: 'production',
    });

    this.tiles = this.defineStringParameter({
      argumentName: 'TILES',
      parameterLongName: '--tiles',
      description: 'JSON file path for the test tiles',
      defaultValue: './test-tiles/default.test.tiles.json',
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    logger.info('Page:Launch');
    const chrome = await chromium.launch();
    const host = this.host.value ?? this.host.defaultValue;
    const tag = this.tag.value ?? this.tag.defaultValue;
    const tiles = this.tiles.value ?? this.tiles.defaultValue;
    if (host == null || tag == null || tiles == null)
      throw new Error('Missing essential parameter to run the process.');

    try {
      await takeScreenshots(host, tag, tiles, chrome, logger);
    } finally {
      await chrome.close();
    }
  }
}

export async function takeScreenshots(
  host: string,
  tag: string,
  tiles: string,
  chrome: Browser,
  logger: LogType,
): Promise<void> {
  const TestTiles = await fsa.readJson<TileTestSchema[]>(tiles);
  for (const test of TestTiles) {
    const page = await chrome.newPage();

    const tileSetId = await getTileSetId(test.tileSet, tag);
    const styleId = await getStyleId(test.style, tag);

    const searchParam = new URLSearchParams();
    searchParam.set('p', test.tileMatrix);
    searchParam.set('i', tileSetId);
    if (styleId) searchParam.set('s', styleId);

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

async function getTileSetId(tileSetId: string, tag: string): Promise<string> {
  if (tag === 'production') return tileSetId;

  const tileSetTagId = `${tileSetId}@${tag}`;
  const dbId = Config.TileSet.id(tileSetTagId);
  const tileSet = await Config.TileSet.get(dbId);

  if (tileSet) return tileSetTagId;
  return tileSetId;
}

async function getStyleId(styleId: string | undefined, tag: string): Promise<string> {
  if (styleId == null) return '';
  if (tag === 'production') return styleId ?? '';

  const styleIdTagId = `${styleId}@${tag}`;
  const dbId = Config.Style.id(styleIdTagId);
  const style = await Config.Style.get(dbId);
  if (style) return styleIdTagId;
  return styleId;
}
