import {
  CommandLineAction,
  CommandLineFlagParameter,
  CommandLineIntegerListParameter,
  CommandLineStringListParameter,
} from '@rushstack/ts-command-line';
import { writeFile } from 'fs/promises';
import { basename } from 'path';
import { listSprites } from './fs.js';
import { Sprites } from './sprites.js';

export class CommandSprites extends CommandLineAction {
  paths: CommandLineStringListParameter;
  ratio: CommandLineIntegerListParameter;
  retina: CommandLineFlagParameter;

  public constructor() {
    super({
      actionName: 'sprites',
      summary: 'Cli tool to create sprite sheet',
      documentation: 'Create a sprite sheet from a folder of sprites',
    });
  }

  protected onDefineParameters(): void {
    this.paths = this.defineStringListParameter({
      argumentName: 'PATH',
      parameterLongName: '--path',
      description: 'Paths to the sprite files.',
    });
    this.ratio = this.defineIntegerListParameter({
      argumentName: 'RATIO',
      parameterLongName: '--ratio',
      description: 'Pixel ratio, default: "--ratio 1 --ratio 2"',
    });

    this.retina = this.defineFlagParameter({
      parameterLongName: '--retina',
      description: 'Double the pixel ratios, 1x becomes 2x',
    });
  }

  protected async onExecute(): Promise<void> {
    if (this.paths?.values == null || this.paths.values.length === 0) {
      throw new Error('No sprite paths supplied');
    }
    const ratio = [...this.ratio.values];
    if (ratio.length === 0) ratio.push(1, 2);

    let baseRatio = 1;
    if (this.retina.value) {
      baseRatio = 2;
      for (let i = 0; i < ratio.length; i++) ratio[i] = ratio[i] * 2;
    }

    for (const spritePath of this.paths.values) {
      const sheetName = basename(spritePath);
      const sprites = await listSprites(spritePath);
      const results = await Sprites.generate(sprites, ratio);

      for (const res of results) {
        const scaleText = res.pixelRatio / baseRatio === 1 ? '' : `@${res.pixelRatio / baseRatio}x`;
        await writeFile(`${sheetName}${scaleText}.json`, JSON.stringify(res.layout, null, 2));
        await writeFile(`${sheetName}${scaleText}.png`, res.buffer);
      }
    }
  }
}
