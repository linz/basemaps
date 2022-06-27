import {
  CommandLineAction,
  CommandLineFlagParameter,
  CommandLineIntegerListParameter,
  CommandLineStringListParameter,
  CommandLineStringParameter,
} from '@rushstack/ts-command-line';

import { buildSprites } from '@basemaps/sprites';

export class CommandSprites extends CommandLineAction {
  paths: CommandLineStringListParameter;
  output: CommandLineStringParameter;
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

    this.output = this.defineStringParameter({
      argumentName: 'OUTPUT',
      parameterLongName: '--output',
      description: 'Paths of the output files',
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
    const paths = [...this.paths.values];
    await buildSprites(ratio, this.retina.value, paths, this.output.value);
  }
}
