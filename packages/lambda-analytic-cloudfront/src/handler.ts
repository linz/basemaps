import { promisify } from 'node:util';
import { gzip } from 'node:zlib';

import { Env, fsa } from '@basemaps/shared';
import { LambdaRequest } from '@linzjs/lambda';
import pLimit from 'p-limit';
import { basename } from 'path';

import { byDay, getOneHourAgo } from './date.js';
import { Elastic } from './elastic.js';
import { FileProcess, toFullDate } from './log.reader.js';
import { LogStats } from './log.stats.js';

const gzipPromise = promisify(gzip);

const OldestDate = new Date('2020-01-01T00:00:00.000Z');

/**
 * extract a environment variable and parse it as a URL
 *
 * @throws if the env var is unset or not a URL
 * @param env ENV var to lookup
 * @returns parsed url from the environment
 */
function getEnvUrl(env: string): URL {
  const val = Env.get(env);
  if (val == null) throw new Error(`$${env} is unset`);
  try {
    return fsa.toUrl(val);
  } catch (e) {
    throw new Error(`$${env} is not a url`);
  }
}

export async function main(req: LambdaRequest): Promise<void> {
  const SourceLocation = getEnvUrl(Env.Analytics.CloudFrontSourceBucket);
  const CacheLocation = getEnvUrl(Env.Analytics.CacheBucket);
  const CloudFrontId = Env.get(Env.Analytics.CloudFrontId);

  const MaxToProcess = Env.getNumber(Env.Analytics.MaxRecords, 24 * 7 * 4); // Process 4 weeks of logs by default

  req.log.info(
    { source: SourceLocation.href, cacheLocation: CacheLocation.href, cloudFrontId: CloudFrontId },
    'log:index:start',
  );
  if (CloudFrontId == null) throw new Error(`Missing $${Env.Analytics.CloudFrontId}`);

  // Limit hours to be processed 5 at a time and log files to 5 at a time, which gives upto 25 logs files concurrency
  // as often hours are skipped
  const hourQ = pLimit(5);
  const fileQ = pLimit(5);

  let processedCount = 0;
  for (const prefixByDay of byDay(getOneHourAgo(), OldestDate)) {
    if (processedCount > MaxToProcess) break;
    const todo = [];

    for (let hour = 23; hour >= 0; hour--) {
      const hourOfDay = String(hour).padStart(2, '0');
      const prefix = `${prefixByDay}-${hourOfDay}`;

      const targetDate = new Date(toFullDate(prefixByDay + 'T' + hourOfDay));
      const dateDiff = Date.now() - targetDate.getTime();

      // Do not process anything within a hour of the current time as some logs take a while to propagate into the bucket
      if (dateDiff < 60 * 60 * 1000) continue;

      processedCount++;
      if (processedCount > MaxToProcess) break;

      // Create a folder structure of /YYYY/MM/
      const cacheFolderParts = prefix.slice(0, 7).replace('-', '/');

      const cacheUrl = new URL(`./RollUpV3/${cacheFolderParts}/${prefix}.ndjson.gz`, CacheLocation);

      const promise = hourQ(async () => {
        // Cache file exists skip processing
        if (await fsa.exists(cacheUrl)) {
          req.log.debug({ prefix }, 'log:prefix:skip');
          return;
        }

        const startTime = performance.now();
        req.log.trace({ prefix }, 'log:prefix:start');
        const logPrefix = new URL(`${CloudFrontId}.${prefix}`, SourceLocation);

        const stats = new Map<string, LogStats>();

        const logFiles = await fsa.toArray(fsa.list(logPrefix));
        if (logFiles.length === 0) {
          req.log.info({ prefix }, 'log:prefix:no-files');
          return;
        }

        let lines = 0;
        let fileCount = 0;
        const filePromises = logFiles.map((lf) => {
          return fileQ(async () => {
            const fileStartTime = performance.now();

            const fileLines = await FileProcess.process(lf, stats);
            req.log.trace(
              {
                prefix: prefix,
                file: basename(lf.pathname),
                lines: fileLines,
                remaining: logFiles.length - fileCount,
                duration: performance.now() - fileStartTime,
              },
              'log:file:done',
            );
            lines += fileLines;
            fileCount++;
          });
        });

        // Process all the log files
        await Promise.all(filePromises);

        // Extract the values
        const allStats = [...stats.values()];
        await Elastic.insert(prefix, allStats, req.log);
        // Ensure everything is indexed into elasticsearch before writing the cache to disk
        await fsa.write(cacheUrl, await gzipPromise(JSON.stringify(allStats)));

        req.log.info(
          {
            prefix: prefix,
            files: logFiles.length,
            lines,
            records: stats.size,
            duration: performance.now() - startTime,
          },
          'log:prefix:done',
        );
      });

      todo.push(promise);
    }

    const rets = await Promise.allSettled(todo);

    // If anything fails to index write the errors out to a log file at the cache location
    if (Elastic.errors.length > 0) {
      const errorLocation = new URL(`./errors-${new Date().toISOString()}.json`, CacheLocation);
      req.log.fatal({ errorLocation: errorLocation.href }, 'log:index:failed');
      await fsa.write(errorLocation, JSON.stringify(Elastic.errors));
    }

    let failed = false;
    for (const ret of rets) {
      if (ret.status !== 'rejected') continue;
      req.log.fatal({ err: ret.reason }, 'log:index:failed');
      failed = true;
    }
    if (failed) throw new Error('Failed to index');
  }
}
