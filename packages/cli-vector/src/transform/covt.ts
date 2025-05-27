import { fsa, LogType, SourceMemory, urlToString } from '@basemaps/shared';
import { CotarIndexBuilder, CotarIndexOptions, TarReader } from '@cotar/builder';
import { CotarIndex } from '@cotar/core';
import { promises as fs } from 'fs';

/**
 * Create index for the COVT tar file
 */
export async function toTarIndex(input: URL, output: URL, logger: LogType): Promise<URL> {
  logger.info({ output: output.href }, 'Cotar.Index:Start');

  const fd = await fs.open(input, 'r');

  const opts: CotarIndexOptions = { packingFactor: 1.25, maxSearch: 50 }; // Default package rule.
  const { buffer, count } = await CotarIndexBuilder.create(fd, opts);

  const index = await CotarIndex.create(new SourceMemory('index', buffer));
  await TarReader.validate(fd, index);
  await fs.writeFile(urlToString(output), buffer);
  await fs.appendFile(urlToString(input), buffer);

  await fd.close();
  if (!(await fsa.exists(output))) throw new Error('Error - Cotar.Index creation Failure.');

  logger.info({ index, count }, 'Cotar.Index:Done');
  return output;
}
