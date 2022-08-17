import { Env, fsa, LogConfig, RoleRegister } from '@basemaps/shared';
import { CommandLineAction, CommandLineIntegerParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { parseSize } from './sizes.js';

export interface FileSizeInfo {
  path: string;
  size?: number;
}

export class CommandList extends CommandLineAction {
  private filter: CommandLineStringParameter;
  private output: CommandLineStringParameter;
  private group: CommandLineIntegerParameter;
  private groupSize: CommandLineStringParameter;
  private limit: CommandLineIntegerParameter;
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
    this.groupSize = this.defineStringParameter({
      argumentName: 'GROUP_SIZE',
      parameterLongName: '--group-size',
      description: 'Group files into this size per group, eg "5Gi" or "3TB"',
    });
    this.limit = this.defineIntegerParameter({
      argumentName: 'LIMIT',
      parameterLongName: '--limit',
      description: 'Limit the file count to this amount, -1 is no limit',
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

    const limit = this.limit.value ?? -1; // no limit by default
    const filter = this.filter.value ?? '*'; // Filter everything by default

    const outputFiles: FileSizeInfo[] = [];
    for (const targetPath of paths) {
      logger.debug({ path: targetPath }, 'List');
      const assumedRole = await RoleRegister.findRole(targetPath);
      if (assumedRole) logger.debug({ path: targetPath, roleArn: assumedRole?.roleArn }, 'List:Role');

      const fileList = await fsa.toArray(asyncFilter(fsa.details(targetPath), filter));
      logger.debug({ path: targetPath, fileCount: fileList.length }, 'List:Count');

      for (const file of fileList) {
        outputFiles.push(file);
        if (limit > 0 && outputFiles.length >= limit) break;
      }
      if (limit > 0 && outputFiles.length >= limit) break;
    }

    const maxSize = parseSize(this.groupSize.value ?? '-1');
    const maxLength = this.group.value ?? -1;
    await fsa.write(outputPath, JSON.stringify(chunkFiles(outputFiles, maxLength, maxSize)));
  }
}

export async function* asyncFilter<T extends { path: string }>(
  source: AsyncGenerator<T>,
  filter: string,
): AsyncGenerator<T> {
  if (filter === '*') return yield* source;

  const re = new RegExp(filter.toLowerCase(), 'i');
  for await (const f of source) {
    // Always match on lowercase
    if (re.test(f.path.toLowerCase())) yield f;
  }
}

/** Chunk files into a max size (eg 1GB chunks) or max count (eg 100 files) or what ever comes first when both are defined */
export function chunkFiles(values: FileSizeInfo[], count: number, size: number): string[][] {
  if (count == null && size == null) return [values.map((c) => c.path)];

  const output: string[][] = [];
  let current: string[] = [];
  let totalSize = 0;
  for (const v of values) {
    current.push(v.path);
    if (v.size) totalSize += v.size;
    if ((count > 0 && current.length >= count) || (size > 0 && totalSize >= size)) {
      output.push(current);
      current = [];
      totalSize = 0;
    }
  }
  if (current.length > 0) output.push(current);
  return output;
}
