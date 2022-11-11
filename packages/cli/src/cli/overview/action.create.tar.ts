import { LogConfig, LogType } from '@basemaps/shared';
import { promises as fs } from 'fs';
import { CommandLineAction, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { CotarIndexBinary, CotarIndexBuilder, TarReader } from '@cotar/core';
import { SourceMemory } from '@chunkd/core';
import { fsa } from '@chunkd/fs';
import { TarBuilder } from '@cotar/tar';

export class CommandCreateTar extends CommandLineAction {
  private path: CommandLineStringParameter;
  private output: CommandLineStringParameter;

  public constructor() {
    super({
      actionName: 'create-tar',
      summary: 'Create co tar file for overview',
      documentation: 'Create co tar file for overview',
    });
  }

  protected onDefineParameters(): void {
    this.path = this.defineStringParameter({
      argumentName: 'PATH',
      parameterLongName: '--path',
      description: 'Path contains all the tiles',
      required: true,
    });
    this.output = this.defineStringParameter({
      argumentName: 'OUTPUT',
      parameterLongName: '--output',
      description: 'output path for the co tar file',
      required: true,
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const path = this.path.value;
    const output = this.output.value;
    if (path == null || output == null) throw new Error('Please provide path and output for generating tiles');

    await createTar(path, output, logger);
  }
}

export async function createTar(path: string, output: string, logger: LogType): Promise<void> {
  const tarFile = 'overviews.tar.co';
  const tarFilePath = fsa.join('overview', tarFile);

  // Create tar file
  const files = await fsa.toArray(fsa.list(path));
  const tiles = files.filter((f) => f.endsWith('.webp'));
  const tarBuilder = new TarBuilder(tarFilePath);
  tiles.sort((a, b) => a.localeCompare(b));
  for (const file of tiles) await tarBuilder.write(file.slice(file.indexOf('tiles/')), await fsa.read(file));

  // Creating tar index
  const fd = await fs.open(tarFilePath, 'r');
  const index = await CotarIndexBuilder.create(fd);
  const indexBinary = await CotarIndexBinary.create(new SourceMemory('index', index.buffer));
  await TarReader.validate(fd, indexBinary);
  await fd.close();
  await fs.appendFile(tarFilePath, index.buffer);

  // Copy the output into s3 location
  logger.info({ path }, 'CreateOverview: UploadOutput');
  const outputPath = fsa.join(output, tarFile);
  if (outputPath !== tarFilePath) await fsa.write(outputPath, fsa.stream(tarFilePath));
}
