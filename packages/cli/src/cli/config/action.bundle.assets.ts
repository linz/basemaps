import { base58 } from '@basemaps/config';
import { fsa, LogType, SourceMemory } from '@basemaps/shared';
import { CliInfo } from '@basemaps/shared/build/cli/info.js';
import { CotarIndexBuilder, TarReader } from '@cotar/builder';
import { CotarIndex } from '@cotar/core';
import { TarBuilder } from '@cotar/tar';
import { Metrics } from '@linzjs/metrics';
import { command, option, string } from 'cmd-ts';
import { BinaryLike, createHash } from 'crypto';
import { createReadStream, promises as fs } from 'fs';
import { Readable } from 'stream';

import { getLogger, logArguments } from '../log.js';

const Packing = 25; // Packing factor for the hash map
const MaxSearch = 50; // Max search factor

export async function hashFile(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    stream.on('data', (chunk: BinaryLike) => hash.update(chunk));
    stream.on('end', () => resolve(base58.encode(hash.digest())));
    stream.on('error', (err) => reject(err));
  });
}

export const BundleAssetsCommand = command({
  name: 'bundle-assets',
  version: CliInfo.version,
  description: 'Cli tool to create cotar file for the config assets. Creates a cotar file from a directory.',
  args: {
    ...logArguments,
    assets: option({
      type: string,
      long: 'assets',
      description: 'Paths to the input assets files, must contain assets/sprites/ and assets/fonts.',
    }),
    output: option({
      type: string,
      long: 'output',
      description: 'Paths of the output co tar file.',
    }),
  },

  async handler(args) {
    const metrics = new Metrics();
    const logger = getLogger(this, args);

    if (!args.output.endsWith('.tar.co')) throw new Error(`Invalid output, needs to be .tar.co :"${args.output}"`);

    metrics.start('assets:bundle');
    logger.info({ input: args.assets }, 'BundleAssets:Start');
    const tarFile = await buildTar(fsa.toUrl(args.assets), args.output, logger);
    const cotarFile = await buildTarCo(tarFile, args.output, logger);
    const cotarHash = await hashFile(createReadStream(cotarFile));

    await fs.rename(cotarFile, cotarFile.replace('.tar.co', `-${cotarHash}.tar.co`));

    logger.info({ output: cotarFile, hash: cotarHash }, 'BundleAssets:Finish');
    metrics.end('assets:bundle');
  },
});

async function buildTar(input: URL, output: string, logger: LogType): Promise<string> {
  const startTime = Date.now();
  const outputTar = output.split('.co')[0];

  const tarBuilder = new TarBuilder(outputTar);

  const files = await fsa.toArray(fsa.list(input));
  // Ensure files are put into the same order
  files.sort((a, b) => a.href.localeCompare(b.href));
  logger.info({ output: outputTar, files: files.length }, 'Tar:Create');

  for (const file of files) {
    const filePath = file.href.replace(input.href, '');
    if (filePath.startsWith('/')) filePath.slice(1); // Remove the leading '/'
    await tarBuilder.write(decodeURI(filePath), await fsa.read(file));
  }

  await tarBuilder.close();

  logger.info({ output: outputTar, stats: tarBuilder.stats, duration: Date.now() - startTime }, 'Tar:Create:Done');
  return outputTar;
}

async function buildTarCo(input: string, output: string, logger: LogType): Promise<string> {
  logger.info({ output }, 'Cotar:Create');

  const indexFile = input + '.index';

  const startTime = Date.now();
  const buf = await toTarIndex(input, indexFile, logger);

  logger.info({ output }, 'Cotar:Create:WriteTar');
  await fs.copyFile(input, output);
  await fs.appendFile(output, buf);

  const duration = Date.now() - startTime;
  logger.info({ output, duration }, 'Cotar:Created');
  return output;
}

async function toTarIndex(filename: string, indexFileName: string, logger: LogType): Promise<Buffer> {
  const fd = await fs.open(filename, 'r');
  logger.info({ index: indexFileName }, 'Cotar.Index:Start');
  const startTime = Date.now();

  const { buffer, count } = await CotarIndexBuilder.create(fd, {
    packingFactor: 1 + Packing / 100,
    maxSearch: MaxSearch,
  });

  logger.info({ count, size: buffer.length, duration: Date.now() - startTime }, 'Cotar.Index:Created');
  const index = await CotarIndex.create(new SourceMemory('index', buffer));
  await TarReader.validate(fd, index);
  await fd.close();
  return buffer;
}
