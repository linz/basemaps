import { Env, fsa, LogConfig, RoleRegister } from '@basemaps/shared';
import { CommandLineAction, CommandLineIntegerParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';

export class CommandList extends CommandLineAction {
  private filter: CommandLineStringParameter;
  private output: CommandLineStringParameter;
  private group: CommandLineIntegerParameter;
  private config: CommandLineStringParameter;

  public constructor() {
    super({
      actionName: 'list',
      summary: 'List a location and return the files in a JSON array',
      documentation: 'Find the correct role to assume, assume it and list a s3 location',
    });
  }

  protected onDefineParameters(): void {
    this.filter = this.defineStringParameter({
      argumentName: 'FILTER',
      parameterLongName: '--filter',
      description: 'filter files eg ".*.tiff"',
    });
    this.group = this.defineIntegerParameter({
      argumentName: 'GROUP',
      parameterLongName: '--group',
      description: 'Group files into this number per group',
    });
    this.output = this.defineStringParameter({
      argumentName: 'OUTPUT',
      parameterLongName: '--output',
      required: true,
      description: 'Output location for the listing',
    });
    this.config = this.defineStringParameter({
      argumentName: 'CONFIG',
      parameterLongName: '--config',
      description: 'Location of a configuration file containing role->bucket mapping information',
    });
    this.defineCommandLineRemainder({
      description: 'List of locations to iterate',
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const config = this.config.value;
    if (config) {
      logger.info({ path: config }, 'Role:Config');
      process.env[Env.AwsRoleConfigPath] = config;
    }
    const paths = this.remainder?.values ?? [];
    if (paths.length === 0) throw new Error('No listing paths given');
    const outputPath = this.output.value;
    if (outputPath == null) throw new Error('Missing --output path');

    const filter = this.filter.value ?? '*'; // Filter everything by default

    const outputFiles = new Set<string>();
    for (const targetPath of paths) {
      logger.debug({ path: targetPath }, 'List');
      const assumedRole = await RoleRegister.findRole(targetPath);
      if (assumedRole) logger.debug({ path: targetPath, roleArn: assumedRole?.roleArn }, 'List:Role');

      const fileList = await fsa.toArray(asyncFilter(fsa.list(targetPath), filter));
      logger.debug({ path: targetPath, fileCount: fileList.length }, 'List:Count');

      for (const file of fileList) outputFiles.add(file);
    }

    if (this.group.value == null) {
      await fsa.write(outputPath, JSON.stringify([...outputFiles.values()]));
    } else {
      await fsa.write(outputPath, JSON.stringify(chunkArray(outputFiles, this.group.value)));
    }
  }
}

export async function* asyncFilter(source: AsyncGenerator<string>, filter: string): AsyncGenerator<string> {
  if (filter === '*') return yield* source;

  const re = new RegExp(filter.toLowerCase(), 'i');
  for await (const f of source) {
    // Always match on lowercase
    if (re.test(f.toLowerCase())) yield f;
  }
}

export function chunkArray<T>(values: Set<T> | T[], size: number): T[][] {
  const output: T[][] = [];
  let current: T[] = [];
  for (const v of values) {
    current.push(v);
    if (current.length >= size) {
      output.push(current);
      current = [];
    }
  }
  if (current.length > 0) output.push(current);
  return output;
}
