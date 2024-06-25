import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import { gzipSync } from 'node:zlib';

import { Env, fsa, FsMemory, LogConfig } from '@basemaps/shared';
import PLimit from 'p-limit';

import { dateByHour, getMaxDate, handler, listCacheFolder, MaxToProcess, Q } from '../index.js';
import { CacheFolder, LogStartDate, RollupVersion } from '../stats.js';
import { ExampleLogs } from './file.process.test.js';

LogConfig.get().level = 'silent';
const currentYear = new Date().getUTCFullYear();
// Concurrency breaks the order of tests
Q.time = PLimit(1);

describe('hourByHour', () => {
  const firstLogHour = (hour: number): string =>
    LogStartDate.toISOString().replace('T00', 'T' + hour.toString().padStart(2, '0'));
  it(`should start around ${currentYear}-01-01`, () => {
    const startDate = LogStartDate.getTime();
    const iter = dateByHour(startDate);
    for (let i = 0; i < 5; i++) {
      assert.equal(firstLogHour(i), new Date(iter.next().value as string).toISOString());
    }
  });

  it('should work for thousands of hours', () => {
    const startDate = new Date(LogStartDate).getTime();
    const iter = dateByHour(startDate);
    let startHour = 0;
    let lastDate = startDate - 60 * 60 * 1000;
    // Loop over the next 10,000 hours and verify we always increase by one UTC hour
    // I have manually run this for 10,000,000 hours and seems to work (about 1000 years)
    for (let i = 0; i < 10000; i++) {
      const nextDate = new Date(iter.next().value as string);
      const timeInc = nextDate.getTime() - lastDate;
      lastDate = nextDate.getTime();

      assert.equal(nextDate.getUTCHours(), startHour, `${i} - ${nextDate.toISOString()}`);
      assert.equal(timeInc, 60 * 60 * 1000, `${i} - ${timeInc}`);
      startHour++;
      if (startHour === 24) startHour = 0;
    }
  });
});

describe('getStartDate', () => {
  const fsMemory = new FsMemory();
  before(() => {
    fsa.register('s3://', fsMemory);
  });

  it('should use the start date if no files found', async () => {
    const cacheData = await listCacheFolder(new URL('s3://foo/bar'));
    assert.equal(cacheData.size, 0);
  });

  it('should not use the start date if files are found', async () => {
    await fsa.write(new URL(`s3://analytics-analyticcachebucketd96a8b35-11baj9/${CacheFolder}baz.txt`), '');
    await fsa.write(
      new URL(`s3://analytics-analyticcachebucketd96a8b35-11baj9/${CacheFolder}2020-01-01T01.ndjson`),
      '',
    );

    const cacheData = await listCacheFolder(new URL('s3://analytics-analyticcachebucketd96a8b35-11baj9'));
    assert.equal(cacheData.size, 1);
    assert.equal(cacheData.has('2020-01-01T01'), true);
  });
});

describe('handler', () => {
  const sourceBucket = `s3://cloudfront-logs`;
  const cloudFrontId = `E1WKYJII8YDTO0`;

  process.env[Env.Analytics.CloudFrontId] = cloudFrontId;
  process.env[Env.Analytics.CloudFrontSourceBucket] = sourceBucket;
  process.env[Env.Analytics.CacheBucket] = `s3://analytics-cache`;

  const fsMemory = new FsMemory();
  before(() => {
    fsa.register('s3://', fsMemory);
  });

  it('should list and process files', async () => {
    const cachePath = `s3://analytics-cache/RollUpV${RollupVersion}/${currentYear}`;

    await fsa.write(
      new URL(`s3://cloudfront-logs/E1WKYJII8YDTO0.${currentYear}-01-01-02.abc123`),
      gzipSync(ExampleLogs.join('\n').replaceAll('2020-07-28	01', `${currentYear}-01-01	02`)),
    );

    await handler();

    // Get the expected number of writes to be called
    const maxDate = getMaxDate().getTime();
    let expectedCount = 0;
    for (const hour of dateByHour(LogStartDate.getTime())) {
      if (hour >= maxDate || expectedCount > MaxToProcess) break;
      expectedCount++;
    }

    assert.equal(expectedCount > 0, true);

    // T02 is processed
    const outputFile = fsMemory.files.get(`${cachePath}/${currentYear}-01-01T02.ndjson`)?.buffer.toString();
    assert.equal(outputFile?.split('\n').length, 2);
    // assert.equal(data, 950);

    // all others are skipped
    assert.equal(fsMemory.files.get(`${cachePath}/${currentYear}-01-01T01.ndjson`)?.buffer.length, 0);
    assert.equal(fsMemory.files.get(`${cachePath}/${currentYear}-01-01T03.ndjson`)?.buffer.length, 0);
    assert.equal(fsMemory.files.get(`${cachePath}/${currentYear}-01-01T04.ndjson`)?.buffer.length, 0);
  });
});
