import { Env, LogConfig } from '@basemaps/shared';
import { S3Fs } from '@linzjs/s3fs';
import PLimit from 'p-limit';
import { FileProcess } from './file.process';
import { LogStats } from './stats';
import { TileRollupVersion } from './stats';

const Logger = LogConfig.get();

const Q = PLimit(5); // Process 5 files at a time
export const s3fs = new S3Fs();

export function* dateByHour(startDate: number): Generator<number> {
    const currentDate = new Date(startDate);
    currentDate.setUTCMinutes(0);
    currentDate.setUTCSeconds(0);
    currentDate.setUTCMilliseconds(0);
    while (true) {
        currentDate.setUTCHours(currentDate.getUTCHours() + 1);
        yield currentDate.getTime();
    }
}

const CacheFolder = `RollUpV${TileRollupVersion}/`;
const CacheExtension = '.ndjson';

/** Look at the existing files in the cache bucket and find the latest cache file */
export async function getStartDate(cachePath: string): Promise<number> {
    // Find where the last script finished processing
    let startTime = new Date(FirstLog).getTime();
    const cachePathList = s3fs.join(cachePath, CacheFolder);
    if (s3fs.isS3(cachePathList) || (await s3fs.exists(cachePathList))) {
        const existing = await s3fs.list(cachePathList);
        for (const file of existing) {
            if (!file.endsWith(CacheExtension)) continue;
            const cacheFileName = file.split('/').pop()?.replace(CacheExtension, '');
            if (cacheFileName == null) continue;

            const cacheDate = new Date(cacheFileName + ':00:00.000Z');
            if (isNaN(cacheDate.getTime())) continue;
            if (cacheDate.getTime() > startTime) startTime = cacheDate.getTime();
        }
    }
    return startTime;
}

// Date of the first log line to look for (About when basemap's started logging to cloudFront)
export const FirstLog = '2020-07-28T00:00:00.000Z';

export async function handler(): Promise<void> {
    const SourceLocation = process.env[Env.Analytics.CloudFrontSourceBucket];
    const CacheLocation = process.env[Env.Analytics.CacheBucket];
    const CloudFrontId = process.env[Env.Analytics.CloudFrontId];

    if (SourceLocation == null) throw new Error(`Missing $${Env.Analytics.CloudFrontSourceBucket}`);
    if (CacheLocation == null) throw new Error(`Missing $${Env.Analytics.CacheBucket}`);
    if (CloudFrontId == null) throw new Error(`Missing $${Env.Analytics.CloudFrontId}`);

    const startTime = await getStartDate(CacheLocation);

    // Process up to about a hour ago
    const MaxDate = new Date();
    MaxDate.setUTCMinutes(0);
    MaxDate.setUTCSeconds(0);
    MaxDate.setUTCMilliseconds(0);
    MaxDate.setUTCHours(MaxDate.getUTCHours() - 1);

    // number of hours processed
    let hourCount = 0;
    let processedCount = 0;

    // Hour by hour look for new log lines upto about a hour ago
    for (const nextHour of dateByHour(startTime)) {
        hourCount++;

        if (hourCount > 100) break;
        const startAt = new Date(nextHour).toISOString();
        Logger.trace({ startAt, hourCount, processedCount }, 'Processing');

        if (nextHour > MaxDate.getTime()) break;

        const nextDateToProcess = new Date(nextHour).toISOString().slice(0, 13);
        const nextDateKey = nextDateToProcess.replace('T', '-');

        // Filter for files in the date range we are looking for
        const todoFiles = await s3fs.list(s3fs.join(SourceLocation, `${CloudFrontId}.${nextDateKey}`));
        if (todoFiles.length == 0) continue; // Nothing to process
        Logger.trace({ startAt, fileCount: todoFiles.length }, 'FoundFiles');

        LogStats.ByDate.clear();

        await Promise.all(
            todoFiles.map((fileName) => Q(() => FileProcess.process(fileName, Logger.child({ fileName })))),
        );

        // Only one date range should be processed at a time
        if (LogStats.ByDate.size > 1) {
            throw new Error(`Date range: ${new Date(nextHour).toISOString()} was processed into more than one range??`);
        }

        const [stats] = [...LogStats.ByDate.values()];

        const output = [];
        if (stats != null) {
            for (const apiData of stats.stats.values()) {
                output.push(JSON.stringify(apiData));
                // By logging this line here, it will be filtered through into ElasticSearch
                Logger.info({ ...apiData, '@type': 'rollup' }, 'RequestSummary');
            }
        }

        const cacheKey = s3fs.join(CacheFolder, nextDateToProcess + '.ndjson');
        await s3fs.write(s3fs.join(CacheLocation, cacheKey), Buffer.from(output.join('\n')));
        processedCount++;
        if (hourCount > 24 * 7) {
            Logger.warn({ hourCount }, 'Processed more than 7 days, stopping');
            break;
        }
    }
}
