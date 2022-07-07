import { CommandLineAction, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { SourceMemory } from '@chunkd/core';
import { CotarIndexBinary, CotarIndexBuilder, CotarIndexOptions, TarReader } from '@cotar/core';
import { LogConfig, LogType } from '@basemaps/shared';
import { promises as fs } from 'fs';
import { TarBuilder } from '@cotar/tar';
import { fsa } from '@chunkd/fs';
import * as path from 'path';

const Packing = 25; // Packing factor for the hash map
const MaxSearch = 50; // Max search factor

export class CommandBundleAssets extends CommandLineAction {
  assets: CommandLineStringParameter;
  output: CommandLineStringParameter;

  public constructor() {
    super({
      actionName: 'bundle-assets',
      summary: 'Cli tool to create cotar file for the config assets',
      documentation: 'Create a cotar file from a directory',
    });
  }

  protected onDefineParameters(): void {
    this.assets = this.defineStringParameter({
      argumentName: 'ASSETS',
      parameterLongName: '--assets',
      description: 'Paths to the input assets files, must contain assets/sprites/ and assets/fonts.',
    });

    this.output = this.defineStringParameter({
      argumentName: 'OUTPUT',
      parameterLongName: '--output',
      description: 'Paths of the output co tar file.',
    });
  }

  protected async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const assets = this.assets.value;
    const output = this.output.value;
    if (assets == null || output == null) throw new Error('Please provide a input or ouput path');
    if (!output.endsWith('.tar.co')) throw new Error(`Invalid output, needs to be .tar.co :"${output}"`);

    logger.info({ indput: assets }, 'BundleAssets:Start');
    const tarFile = await this.buildTar(assets, output, logger);
    const cotarFile = await this.buildTarCo(tarFile, output, logger);
    logger.info({ output: cotarFile }, 'BundleAssets:Finish');
  }

  async buildTar(input: string, output: string, logger: LogType): Promise<string> {
    const startTime = Date.now();
    const outputTar = output.split('.co')[0];

    const tarBuilder = new TarBuilder(outputTar);

    const files = await fsa.toArray(fsa.list(input));
    // Ensure files are put into the same order
    files.sort((a, b) => a.localeCompare(b));
    logger.info({ output: outputTar, files: files.length }, 'Tar:Create');

    const basePath = path.resolve(input);
    for (const file of files) {
      const filePath = file.replace(basePath, '').slice(1); // Remove the leading '/'
      await tarBuilder.write(filePath, await fsa.read(file));
    }

    await tarBuilder.close();

    logger.info({ output: outputTar, stats: tarBuilder.stats, duration: Date.now() - startTime }, 'Tar:Create:Done');
    return outputTar;
  }

  async buildTarCo(input: string, output: string, logger: LogType): Promise<string> {
    logger.info({ output }, 'Cotar:Create');

    const opts: CotarIndexOptions = { packingFactor: 1 + Packing / 100, maxSearch: MaxSearch };

    const indexFile = input + '.index';

    const startTime = Date.now();
    const buf = await this.toTarIndex(input, indexFile, opts, logger);

    logger.info({ output }, 'Cotar:Craete:WriteTar');
    await fs.copyFile(input, output);
    await fs.appendFile(output, buf);

    const duration = Date.now() - startTime;
    logger.info({ output, duration }, 'Cotar:Created');
    return output;
  }

  async toTarIndex(filename: string, indexFileName: string, opts: CotarIndexOptions, logger: LogType): Promise<Buffer> {
    const fd = await fs.open(filename, 'r');
    logger.info({ index: indexFileName }, 'Cotar.Index:Start');
    const startTime = Date.now();

    const { buffer, count } = await CotarIndexBuilder.create(fd, opts);

    logger.info({ count, size: buffer.length, duration: Date.now() - startTime }, 'Cotar.Index:Created');
    const index = await CotarIndexBinary.create(new SourceMemory('index', buffer));
    await TarReader.validate(fd, index);
    await fd.close();
    return buffer;
  }
}
