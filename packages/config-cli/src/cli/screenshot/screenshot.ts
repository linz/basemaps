import { GoogleTms, Nztm2000QuadTms } from '@basemaps/geo';
import { Config, LogConfig, LogType } from '@basemaps/shared';
import { mkdir } from 'fs/promises';
import { Browser, chromium } from 'playwright';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';

const TileTest = [
  {
    name: 'health-3857-z5',
    tileMatrix: GoogleTms,
    location: { lat: -41.8899962, lng: 174.0492437, z: 5 },
    tileSet: 'health',
    style: undefined,
  },
  {
    name: 'health-2193-z5',
    tileMatrix: Nztm2000QuadTms,
    location: { lat: -41.8899962, lng: 174.0492437, z: 1 },
    tileSet: 'aerial',
  },
  {
    name: 'topographic-3857-z5',
    tileMatrix: GoogleTms,
    location: { lat: -41.8899962, lng: 174.0492437, z: 5 },
    tileSet: 'topographic',
    style: 'topographic',
  },
  {
    name: 'topolite-3857-z5',
    tileMatrix: GoogleTms,
    location: { lat: -41.8899962, lng: 174.0492437, z: 5 },
    tileSet: 'topographic',
    style: 'topolite',
  },
  {
    name: 'topographic-3857-z14',
    tileMatrix: GoogleTms,
    location: { lat: -41.8899962, lng: 174.0492437, z: 14 },
    tileSet: 'topographic',
    style: 'topographic',
  },
  {
    name: 'topolite-3857-z17',
    tileMatrix: GoogleTms,
    location: { lat: -43.8063936, lng: 172.9679876, z: 17 },
    tileSet: 'topographic',
    style: 'topolite',
  },
];

export class CommandScreenShot extends CommandLineAction {
  private host: CommandLineStringParameter;
  private tag: CommandLineStringParameter;
  private verbose?: CommandLineFlagParameter;

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

    this.verbose = this.defineFlagParameter({
      parameterLongName: '--verbose',
      description: 'Verbose logging',
      required: false,
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const verbose = this.verbose?.value ?? false;
    if (verbose) logger.level = 'trace';

    logger.info('Page:Launch');
    const chrome = await chromium.launch();

    try {
      await this.takeScreenshots(chrome, logger);
    } finally {
      await chrome.close();
    }
  }

  async takeScreenshots(chrome: Browser, logger: LogType): Promise<void> {
    const host = this.host.value ?? this.host.defaultValue;
    const tag = this.tag.value ?? this.tag.defaultValue;
    if (host == null || tag == null) throw new Error('Missing host or tag.');

    for (const test of TileTest) {
      const page = await chrome.newPage();

      const tileSetId = await this.getTileSetId(test.tileSet, tag);
      const styleId = await this.getStyleId(test.style, tag);

      const searchParam = new URLSearchParams();
      searchParam.set('p', test.tileMatrix.identifier);
      searchParam.set('i', tileSetId);
      if (styleId) searchParam.set('s', styleId);

      const loc = `@${test.location.lat},${test.location.lng},z${test.location.z}`;
      const fileName = '.artifacts/visual-snapshots/' + host + '_' + test.name + '.png';

      await mkdir(`.artifacts/visual-snapshots/`, { recursive: true });

      const url = `https://${host}/?${searchParam.toString()}&debug=true&debug.screenshot=true#${loc}`;

      logger.info({ url, expected: fileName }, 'Page:Load');

      await page.goto(url);

      try {
        if (host.startsWith('dev')) {
          await page.waitForSelector('div#map-loaded', { state: 'attached' });
          await page.waitForTimeout(1000);
          await page.waitForLoadState('networkidle');
        } else {
          throw new Error('Not supported on production yet');
        }
        await page.screenshot({ path: fileName });
      } catch (e) {
        await page.screenshot({ path: fileName });
        throw e;
      }
      logger.info({ url, expected: fileName }, 'Page:Load:Done');
      await page.close();
    }
  }

  async getTileSetId(tileSetId: string, tag: string): Promise<string> {
    if (tag === 'production') return tileSetId;

    const tileSetTagId = `${tileSetId}@${tag}`;
    const dbId = Config.TileSet.id(tileSetTagId);
    const tileSet = await Config.TileSet.get(dbId);

    if (tileSet) return tileSetTagId;
    return tileSetId;
  }

  async getStyleId(styleId: string | undefined, tag: string): Promise<string> {
    if (styleId == null) return '';
    if (tag === 'production') return styleId ?? '';

    const styleIdTagId = `${styleId}@${tag}`;
    const dbId = Config.Style.id(styleIdTagId);
    const style = await Config.Style.get(dbId);
    if (style) return styleIdTagId;
    return styleId;
  }
}
