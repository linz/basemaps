import { fsa, LogType, SourceMemory } from '@basemaps/shared';
import { CotarIndexBuilder, CotarIndexOptions, TarReader } from '@cotar/builder';
import { CotarIndex } from '@cotar/core';
import { promises as fs } from 'fs';

/**
 * Create index for the COVT tar file
 */
export async function toTarIndex(input: URL, outputPath: URL, filename: string, logger: LogType): Promise<URL> {
  const outputIndex = new URL(`${filename}.tar.index`, outputPath);
  logger.info({ outputIndex }, 'Cotar.Index:Start');

  const fd = await fs.open(input, 'r');

  const opts: CotarIndexOptions = { packingFactor: 1.25, maxSearch: 50 }; // Default package rule.
  const { buffer, count } = await CotarIndexBuilder.create(fd, opts);

  const index = await CotarIndex.create(new SourceMemory('index', buffer));
  await TarReader.validate(fd, index);
  await fs.writeFile(outputIndex, buffer);
  await fs.appendFile(input, buffer);

  await fd.close();
  if (!(await fsa.exists(outputIndex))) throw new Error('Error - Cotar.Index creation Failure.');

  logger.info({ index, count }, 'Cotar.Index:Done');
  return outputIndex;
}
