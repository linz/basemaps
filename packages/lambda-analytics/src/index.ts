import { Env, LogConfig } from '@basemaps/shared';
import { S3Fs } from '@linzjs/s3fs';
import PLimit from 'p-limit';
import { FileProcess } from './file.process';
import { CacheExtension, CacheFolder, LogStartDate, LogStats } from './stats';

const Logger = LogConfig.get();

// Threads to run, 5 hours at a time with 5 files at a time
export const Q = {
    file: PLimit(5),
    time: PLimit(5),
};

export const s3fs = new S3Fs();

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
    const cachePathList = s3fs.join(cachePath, CacheFolder);
    if (s3fs.isS3(cachePathList) || (await s3fs.exists(cachePathList))) {
        for await (const file of s3fs.list(cachePathList)) {
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

    // Process up to about a hour ago
    const MaxDate = new Date();
    MaxDate.setUTCMinutes(0);
    MaxDate.setUTCSeconds(0);
    MaxDate.setUTCMilliseconds(0);
    MaxDate.setUTCHours(MaxDate.getUTCHours() - 1);

    // number of hours processed
    let processedCount = 0;
    const MaxToProcess = 24 * 7 * 4;

    const promises: Promise<void>[] = [];

    // Hour by hour look for new log lines upto about a hour ago
    for (const nextHour of dateByHour(LogStartDate.getTime())) {
        if (processedCount >= MaxToProcess) break;

        const startAt = new Date(nextHour).toISOString();
        if (nextHour > MaxDate.getTime()) break;

        const nextDateToProcess = startAt.slice(0, 13);
        if (existingFiles.has(nextDateToProcess)) continue;

        const nextDateKey = nextDateToProcess.replace('T', '-');
        const cacheKey = s3fs.join(CacheFolder, nextDateToProcess + CacheExtension);

        processedCount++;

        const promise = Q.time(async () => {
            // Filter for files in the date range we are looking for
            const todoFiles = await s3fs.toArray(
                s3fs.list(s3fs.join(SourceLocation, `${CloudFrontId}.${nextDateKey}`)),
            );
            if (todoFiles.length == 0) {
                Logger.debug({ startAt }, 'Skipped');

                // Nothing to process, need to store that we have looked at this date range
                await s3fs.write(s3fs.join(CacheLocation, cacheKey), Buffer.from(''));
                return;
            }

            Logger.info({ startAt, fileCount: todoFiles.length }, 'Processing');
            const stats = LogStats.getDate(startAt);

            await Promise.all(
                todoFiles.map((fileName) =>
                    Q.file(() => FileProcess.process(fileName, stats, Logger.child({ fileName }))),
                ),
            );

            const output: string[] = [];
            for (const apiData of stats.stats.values()) {
                output.push(JSON.stringify(apiData));
                // By logging this line here, it will be filtered through into ElasticSearch
                Logger.info({ ...apiData, '@type': 'rollup' }, 'RequestSummary');
            }

            await s3fs.write(s3fs.join(CacheLocation, cacheKey), Buffer.from(output.join('\n')));
        });
        promises.push(promise);
    }
    await Promise.all(promises);
}
