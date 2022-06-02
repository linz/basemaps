import { CommandLineParser } from '@rushstack/ts-command-line';
import { readdir, readFile, writeFile } from 'fs/promises';
import { basename, join } from 'path';
import { Sprites } from './sprites.js';

export class SpriteCli extends CommandLineParser {
  ratio = this.defineIntegerListParameter({
    argumentName: 'RATIO',
    parameterLongName: '--ratio',
    description: 'Pixel ratio, default: "--ratio 1 --ratio 2"',
  });

  retina = this.defineFlagParameter({
    parameterLongName: '--retina',
    description: 'Double the pixel ratios, 1x becomes 2x',
  });
  r = this.defineCommandLineRemainder({ description: 'Path to sprites' });

  constructor() {
    super({
      toolFilename: 'basemaps-sprites',
      toolDescription: 'Create a sprite sheet from a folder of sprites',
    });
  }

  protected onDefineParameters(): void {
    // noop
  }

  protected async onExecute(): Promise<void> {
    if (this.remainder?.values == null || this.remainder.values.length === 0) {
      throw new Error('No sprite paths supplied');
    }
    const ratio = [...this.ratio.values] ?? [1, 2];

    let baseRatio = 1;
    if (this.retina.value) {
      baseRatio = 2;
      for (let i = 0; i < ratio.length; i++) ratio[i] = ratio[i] * 2;
    }

    for (const spritePath of this.remainder.values) {
      const sheetName = basename(spritePath);
      const files = await readdir(spritePath);
      const svgs = files.filter((f) => f.toLowerCase().endsWith('.svg'));
      if (svgs.length === 0) throw new Error('No .svg files found: ' + spritePath);

      const svgData = await Promise.all(
        svgs.map(async (c) => {
          return {
            id: c.slice(0, c.length - 4), // remove the .svg
            svg: await readFile(join(spritePath, c)),
          };
        }),
      );

      const results = await Sprites.generate(svgData, ratio);

      for (const res of results) {
        const scaleText = res.pixelRatio === baseRatio ? '' : `@${res.pixelRatio}x`;
        await writeFile(`${sheetName}${scaleText}.json`, JSON.stringify(res.layout, null, 2));
        await writeFile(`${sheetName}${scaleText}.png`, res.buffer);
      }
    }
  }
}

new SpriteCli().execute();
