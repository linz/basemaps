import { CommandLineParser } from '@rushstack/ts-command-line';
import { writeFile } from 'fs/promises';
import path from 'path';
import { listSprites } from './fs.js';
import { Sprites } from './sprites.js';
import { promises as fs } from 'fs';

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
    // Noop
  }

  protected async onExecute(): Promise<void> {
    if (this.remainder?.values == null || this.remainder.values.length === 0) {
      throw new Error('No sprite paths supplied');
    }
    const ratio = [...this.ratio.values];
    const paths = [...this.remainder.values];
    await buildSprites(ratio, this.retina.value, paths);
  }
}

export async function buildSprites(ratio: number[], retina: boolean, paths: string[], output?: string): Promise<void> {
  if (ratio.length === 0) ratio.push(1, 2);

  let baseRatio = 1;
  if (retina) {
    baseRatio = 2;
    for (let i = 0; i < ratio.length; i++) ratio[i] = ratio[i] * 2;
  }

  for (const spritePath of paths) {
    const sheetName = path.basename(spritePath);
    const sprites = await listSprites(spritePath);
    const results = await Sprites.generate(sprites, ratio);

    for (const res of results) {
      const scaleText = res.pixelRatio / baseRatio === 1 ? '' : `@${res.pixelRatio / baseRatio}x`;
      let outputPath = `${sheetName}${scaleText}`;
      if (output != null) {
        await fs.mkdir(output, { recursive: true });
        outputPath = path.join(output, outputPath);
      }

      await writeFile(`${outputPath}.json`, JSON.stringify(res.layout, null, 2));
      await writeFile(`${outputPath}.png`, res.buffer);
    }
  }
}
