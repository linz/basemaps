import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { fsa } from '@chunkd/fs';
import { LogConfig } from '@basemaps/shared';
import { StyleJson } from '@basemaps/config';
import prettier from 'prettier';

export class CommandImportStyle extends CommandLineAction {
  private style: CommandLineStringParameter;
  private target: CommandLineStringParameter;
  private commit: CommandLineFlagParameter;

  public constructor() {
    super({
      actionName: 'import-style',
      summary: 'import a style json into target json file',
      documentation: 'Given a valid style json url/json and import into target json file.',
    });
  }

  protected onDefineParameters(): void {
    this.style = this.defineStringParameter({
      argumentName: 'STYLE',
      parameterLongName: '--style',
      description: 'Path of style json file or url of style json',
      required: true,
    });
    this.target = this.defineStringParameter({
      argumentName: 'TARGET',
      parameterLongName: '--target',
      description: 'target style json to update',
      required: true,
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
    const style = this.style.value;
    const target = this.target.value;
    if (style == null || target == null) throw new Error('Please provide a valid style json and target');

    const json = await fsa.readJson<StyleJson>(style);
    if (json.version !== 8) return logger.error('Style:Invalid - Invalid version');
    if (!Array.isArray(json.layers)) return logger.error('Style:Invalid - Missing layers');

    const targetStyle = await fsa.readJson<StyleJson>(target);
    targetStyle.layers = json.layers;
    const after = JSON.stringify(targetStyle);

    const cfg = await prettier.resolveConfigFile();
    if (cfg == null) return logger.error('Prettier:MissingConfig');
    const options = await prettier.resolveConfig(cfg);
    const formatted = prettier.format(after, { ...options, printWidth: 200, parser: 'json' });
    if (commit) await fsa.write(target, formatted);
  }
}
