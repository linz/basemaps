import { Env, LogConfig, fsa } from '@basemaps/shared';
import PLimit from 'p-limit';
import { FileProcess } from './file.process.js';
import { CacheExtension, CacheFolder, LogStartDate, LogStats } from './stats.js';

const Logger = LogConfig.get();

export const MaxToProcess = 24 * 7 * 4;

export function getMaxDate(): Date {
  // Process up to about a hour ago
  const maxDate = new Date();
  maxDate.setUTCMinutes(0);
  maxDate.setUTCSeconds(0);
  maxDate.setUTCMilliseconds(0);
  maxDate.setUTCHours(maxDate.getUTCHours() - 1);
  return maxDate;
}

// Threads to run, 5 hours at a time with 5 files at a time
export const Q = {
  file: PLimit(5),
  time: PLimit(5),
};

export function* dateByHour(startDate: number): Generator<number> {
  const currentDate = new Date(startDate);
  currentDate.setUTCMinutes(0);
  currentDate.setUTCSeconds(0);
  currentDate.setUTCMilliseconds(0);
  while (true) {
    yield currentDate.getTime();
    currentDate.setUTCHours(currentDate.getUTCHours() + 1);
  }
}

/** Look at the existing files in the cache bucket and find the latest cache file */
export async function listCacheFolder(cachePath: string): Promise<Set<string>> {
  const existingFiles: Set<string> = new Set();
  // Find where the last script finished processing
  const cachePathList = fsa.join(cachePath, CacheFolder);
  if (cachePathList.startsWith('s3://') || (await fsa.exists(cachePathList))) {
    for await (const file of fsa.list(cachePathList)) {
      if (!file.endsWith(CacheExtension)) continue;
      existingFiles.add(file.replace(cachePathList, '').replace(CacheExtension, ''));
    }
  }
  return existingFiles;
}

export async function handler(): Promise<void> {
  const SourceLocation = process.env[Env.Analytics.CloudFrontSourceBucket];
  const CacheLocation = process.env[Env.Analytics.CacheBucket];
  const CloudFrontId = process.env[Env.Analytics.CloudFrontId];

  if (SourceLocation == null) throw new Error(`Missing $${Env.Analytics.CloudFrontSourceBucket}`);
  if (CacheLocation == null) throw new Error(`Missing $${Env.Analytics.CacheBucket}`);
  if (CloudFrontId == null) throw new Error(`Missing $${Env.Analytics.CloudFrontId}`);

  const existingFiles = await listCacheFolder(CacheLocation);
  Logger.debug({ existingFiles: existingFiles.size }, 'ListedCache');

  // number of hours processed
  let processedCount = 0;
  const MaxDate = getMaxDate();
  const promises: Promise<void>[] = [];

  // Hour by hour look for new log lines upto about a hour ago
  for (const nextHour of dateByHour(LogStartDate.getTime())) {
    if (processedCount >= MaxToProcess) break;

    const startAt = new Date(nextHour).toISOString();
    if (nextHour > MaxDate.getTime()) break;

    const nextDateToProcess = startAt.slice(0, 13);
    if (existingFiles.has(nextDateToProcess)) continue;

    const nextDateKey = nextDateToProcess.replace('T', '-');
    const cacheKey = fsa.join(CacheFolder, nextDateToProcess + CacheExtension);

    processedCount++;

    const promise = Q.time(async () => {
      // Filter for files in the date range we are looking for
      const todoFiles = await fsa.toArray(fsa.list(fsa.join(SourceLocation, `${CloudFrontId}.${nextDateKey}`)));
      if (todoFiles.length === 0) {
        Logger.debug({ startAt }, 'Skipped');

        // Nothing to process, need to store that we have looked at this date range
        await fsa.write(fsa.join(CacheLocation, cacheKey), Buffer.from(''));
        return;
      }

      Logger.info({ startAt, fileCount: todoFiles.length }, 'Processing');
      const stats = LogStats.getDate(startAt);

      await Promise.all(
        todoFiles.map((fileName) => Q.file(() => FileProcess.process(fileName, stats, Logger.child({ fileName })))),
      );

      const output: string[] = [];
      for (const apiData of stats.stats.values()) {
        output.push(JSON.stringify(apiData));
        // By logging this line here, it will be filtered through into ElasticSearch
        Logger.info({ ...apiData, '@type': 'rollup' }, 'RequestSummary');
      }

      await fsa.write(fsa.join(CacheLocation, cacheKey), Buffer.from(output.join('\n')));
    });
    promises.push(promise);
  }
  await Promise.all(promises);
}
