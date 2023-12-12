// import assert from 'node:assert';
// import { afterEach, describe, it } from 'node:test';

// import { Env, LogConfig } from '@basemaps/shared';
// import PLimit from 'p-limit';
// import sinon from 'sinon';

// import { FileProcess } from '../file.process.js';
// import { dateByHour, getMaxDate, handler, listCacheFolder, MaxToProcess, Q } from '../index.js';
// import { LogStartDate, RollupVersion } from '../stats.js';
// import { ExampleLogs, lineReader } from './file.process.test.js';

// const sandbox = sinon.createSandbox();
// LogConfig.get().level = 'silent';
// const currentYear = new Date().getUTCFullYear();
// // Concurrency breaks the order of tests
// Q.time = PLimit(1);

// describe('hourByHour', () => {
//   const firstLogHour = (hour: number): string =>
//     LogStartDate.toISOString().replace('T00', 'T' + hour.toString().padStart(2, '0'));
//   it(`should start around ${currentYear}-01-01`, () => {
//     const startDate = LogStartDate.getTime();
//     const iter = dateByHour(startDate);
//     for (let i = 0; i < 5; i++) {
//       assert.equal(firstLogHour(i), new Date(iter.next().value).toISOString());
//     }
//   });

//   it('should work for thousands of hours', () => {
//     const startDate = new Date(LogStartDate).getTime();
//     const iter = dateByHour(startDate);
//     let startHour = 0;
//     let lastDate = startDate - 60 * 60 * 1000;
//     // Loop over the next 10,000 hours and verify we always increase by one UTC hour
//     // I have manually run this for 10,000,000 hours and seems to work (about 1000 years)
//     for (let i = 0; i < 10000; i++) {
//       const nextDate = new Date(iter.next().value);
//       const timeInc = nextDate.getTime() - lastDate;
//       lastDate = nextDate.getTime();

//       assert.equal(nextDate.getUTCHours(), startHour, `${i} - ${nextDate.toISOString()}`);
//       assert.equal(timeInc, 60 * 60 * 1000, `${i} - ${timeInc}`);
//       startHour++;
//       if (startHour === 24) startHour = 0;
//     }
//   });
// });

// describe('getStartDate', () => {
//   const originalList = fsa.list;
//   afterEach(() => {
//     fsa.list = originalList;
//   });

//   it('should use the start date if no files found', async () => {
//     fsa.list = async function* listFiles(): AsyncGenerator<string> {
//       // yield nothing
//     };
//     const cacheData = await listCacheFolder('s3://foo/bar');
//     assert.equal(cacheData.size, 0);
//   });

//   it('should not use the start date if files are found', async () => {
//     fsa.list = async function* listFiles(key: string): AsyncGenerator<string> {
//       yield `${key}baz.txt`;
//       yield `${key}2020-01-01T01.ndjson`;
//     };
//     const cacheData = await listCacheFolder('s3://foo/bar/');
//     assert.equal(cacheData.size, 1);
//     assert.equal(cacheData.has('2020-01-01T01'), true);
//   });
// });

// describe('handler', () => {
//   const sourceBucket = `s3://cloudfront-logs`;
//   const cloudFrontId = `E1WKYJII8YDTO0`;

//   process.env[Env.Analytics.CloudFrontId] = cloudFrontId;
//   process.env[Env.Analytics.CloudFrontSourceBucket] = sourceBucket;
//   process.env[Env.Analytics.CacheBucket] = `s3://analytics-cache`;

//   afterEach(() => {
//     sandbox.restore();
//   });

//   it('should list and process files', async () => {
//     const cachePath = `s3://analytics-cache/RollUpV${RollupVersion}/${currentYear}`;

//     const sourceFiles = [
//       `${sourceBucket}/${cloudFrontId}.${currentYear}-01-01-00.hash.gz`,
//       `${sourceBucket}/${cloudFrontId}.${currentYear}-01-01-01.hash.gz`,
//       `${sourceBucket}/${cloudFrontId}.${currentYear}-01-01-01.hashB.gz`,
//       `${sourceBucket}/${cloudFrontId}.${currentYear}-01-01-02.hash.gz`,
//       // Old
//       `${sourceBucket}/${cloudFrontId}.2019-07-28-02.hash.gz`,
//     ];
//     sandbox.stub(FileProcess, 'reader').callsFake(lineReader(ExampleLogs, `${currentYear}-01-01T02`));
//     const writeStub = sandbox.stub(fsa, 'write');

//     const listStub = sandbox.stub(fsa, 'list').callsFake(async function* ListFiles(
//       source: string,
//     ): AsyncGenerator<string> {
//       if (source.startsWith(sourceBucket)) {
//         for (const filePath of sourceFiles) {
//           if (filePath.startsWith(source)) yield filePath;
//         }
//       }
//       if (source.startsWith(cachePath)) {
//         yield `${cachePath}/${currentYear}-01-01T00.ndjson`;
//         yield `${cachePath}/${currentYear}-01-01T03.ndjson`;
//       }
//     });

//     await handler();

//     // Get the expected number of writes to be called
//     const maxDate = getMaxDate().getTime();
//     let expectedCount = 0;
//     for (const hour of dateByHour(LogStartDate.getTime())) {
//       if (hour >= maxDate || expectedCount > MaxToProcess) break;
//       expectedCount++;
//     }

//     assert.equal(expectedCount > 0, true);

//     // Two files are already processed
//     assert.equal(writeStub.callCount, Math.min(expectedCount - 1, MaxToProcess));

//     assert.equal(writeStub.args[0][0], `${cachePath}/${currentYear}-01-01T01.ndjson`);
//     assert.equal(writeStub.args[0][1].toString(), '');

//     assert.equal(writeStub.args[1][0], `${cachePath}/${currentYear}-01-01T02.ndjson`);
//     assert.notEqual(writeStub.args[1][1].toString(), '');

//     // Should write empty files when data is not found
//     assert.equal(writeStub.args[2][0], `${cachePath}/${currentYear}-01-01T04.ndjson`);
//     assert.equal(writeStub.args[2][1].toString(), '');

//     assert.equal(writeStub.args[3][0], `${cachePath}/${currentYear}-01-01T05.ndjson`);
//     assert.equal(writeStub.args[3][1].toString(), '');

//     // Will do lots of lists upto todays date to find more data
//     const minExpected = Math.min(expectedCount, 100);
//     assert.equal(listStub.callCount >= minExpected, true);

//     assert.equal(listStub.args[0][0], `s3://analytics-cache/RollUpV${RollupVersion}/${currentYear}/`);
//     assert.equal(listStub.args[1][0], `s3://cloudfront-logs/E1WKYJII8YDTO0.${currentYear}-01-01-01`);
//     assert.equal(listStub.args[2][0], `s3://cloudfront-logs/E1WKYJII8YDTO0.${currentYear}-01-01-02`);
//     assert.equal(listStub.args[3][0], `s3://cloudfront-logs/E1WKYJII8YDTO0.${currentYear}-01-01-04`);
//     assert.equal(listStub.args[4][0], `s3://cloudfront-logs/E1WKYJII8YDTO0.${currentYear}-01-01-05`);
//   });
// });
