import { LogType, SourceMemory } from '@basemaps/shared';
import { CotarIndexBuilder, CotarIndexOptions, TarReader } from '@cotar/builder';
import { CotarIndex } from '@cotar/core';
import { promises as fs } from 'fs';
import path from 'path';

import { fileExist } from '../util.js';

/**
 * Create index for the COVT tar file
 */
export async function toTarIndex(input: URL, outputPath: string, filename: string, logger: LogType): Promise<string[]> {
  const outputIndex = path.join(outputPath, `${filename}.tar.index`);
  const outputTar = path.join(outputPath, `${filename}.tar.co`);
  logger.info({ outputIndex }, 'Cotar.Index:Start');

  const fd = await fs.open(input, 'r');

  const opts: CotarIndexOptions = { packingFactor: 1.25, maxSearch: 50 }; // Default package rule.
  const { buffer, count } = await CotarIndexBuilder.create(fd, opts);

  const index = await CotarIndex.create(new SourceMemory('index', buffer));
  await TarReader.validate(fd, index);
  await fs.writeFile(outputIndex, buffer);
  await fs.copyFile(input, outputTar);
  await fs.appendFile(outputTar, buffer);

  await fd.close();
  if (!(await fileExist(outputIndex))) throw new Error('Error - Cotar.Index creation Failure.');
  if (!(await fileExist(outputTar))) throw new Error('Error - Cotar.tar.co creation Failure.');

  logger.info({ index, count }, 'Cotar.Index:Done');
  return [outputIndex, outputTar];
}
