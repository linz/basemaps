import { Env, LogConfig } from '@basemaps/shared';
import o from 'ospec';
import { createSandbox } from 'sinon';
import { FileProcess } from '../file.process';
import { dateByHour, getMaxDate, handler, listCacheFolder, MaxToProcess, Q, s3fs } from '../index';
import { LogStartDate, RollupVersion } from '../stats';
import { ExampleLogs, lineReader } from './file.process.test';
import PLimit from 'p-limit';

LogConfig.get().level = 'silent';
const currentYear = new Date().getUTCFullYear();
// Concurrency breaks the order of tests
Q.time = PLimit(1);

o.spec('hourByHour', () => {
    const firstLogHour = (hour: number): string =>
        LogStartDate.toISOString().replace('T00', 'T' + hour.toString().padStart(2, '0'));
    o(`should start around ${currentYear}-01-01`, () => {
        const startDate = LogStartDate.getTime();
        const iter = dateByHour(startDate);
        for (let i = 0; i < 5; i++) {
            o(firstLogHour(i)).equals(new Date(iter.next().value).toISOString());
        }
    });

    o('should work for thousands of hours', () => {
        const startDate = new Date(LogStartDate).getTime();
        const iter = dateByHour(startDate);
        let startHour = 0;
        let lastDate = startDate - 60 * 60 * 1000;
        // Loop over the next 10,000 hours and verify we always increase by one UTC hour
        // I have manually run this for 10,000,000 hours and seems to work (about 1000 years)
        for (let i = 0; i < 10000; i++) {
            const nextDate = new Date(iter.next().value);
            const timeInc = nextDate.getTime() - lastDate;
            lastDate = nextDate.getTime();

            o(nextDate.getUTCHours()).equals(startHour)(`${i} - ${nextDate.toISOString()}`);
            o(timeInc).equals(60 * 60 * 1000)(`${i} - ${timeInc}`);
            startHour++;
            if (startHour == 24) startHour = 0;
        }
    });
});

o.spec('getStartDate', () => {
    const originalList = s3fs.list;
    o.afterEach(() => {
        s3fs.list = originalList;
    });

    o('should use the start date if no files found', async () => {
        s3fs.list = async function* listFiles(): AsyncGenerator<string> {
            // yield nothing
        };
        const cacheData = await listCacheFolder('s3://foo/bar');
        o(cacheData.size).equals(0);
    });

    o('should not use the start date if files are found', async () => {
        s3fs.list = async function* listFiles(key: string): AsyncGenerator<string> {
            yield `${key}baz.txt`;
            yield `${key}2020-01-01T01.ndjson`;
        };
        const cacheData = await listCacheFolder('s3://foo/bar/');
        o(cacheData.size).equals(1);
        o(cacheData.has('2020-01-01T01')).equals(true);
    });
});

o.spec('handler', () => {
    const sandbox = createSandbox();
    const sourceBucket = `s3://cloudfront-logs`;
    const cloudFrontId = `E1WKYJII8YDTO0`;

    process.env[Env.Analytics.CloudFrontId] = cloudFrontId;
    process.env[Env.Analytics.CloudFrontSourceBucket] = sourceBucket;
    process.env[Env.Analytics.CacheBucket] = `s3://analytics-cache`;

    o.afterEach(() => {
        sandbox.restore();
    });

    o('should list and process files', async () => {
        const cachePath = `s3://analytics-cache/RollUpV${RollupVersion}/${currentYear}`;

        const sourceFiles = [
            `${sourceBucket}/${cloudFrontId}.${currentYear}-01-01-00.hash.gz`,
            `${sourceBucket}/${cloudFrontId}.${currentYear}-01-01-01.hash.gz`,
            `${sourceBucket}/${cloudFrontId}.${currentYear}-01-01-01.hashB.gz`,
            `${sourceBucket}/${cloudFrontId}.${currentYear}-01-01-02.hash.gz`,
            // Old
            `${sourceBucket}/${cloudFrontId}.2019-07-28-02.hash.gz`,
        ];
        sandbox.stub(FileProcess, 'reader').callsFake(lineReader(ExampleLogs, `${currentYear}-01-01T02`));
        const writeStub = sandbox.stub(s3fs, 'write');

        const listStub = sandbox
            .stub(s3fs, 'list')
            .callsFake(async function* ListFiles(source: string): AsyncGenerator<string> {
                if (source.startsWith(sourceBucket)) {
                    for (const filePath of sourceFiles) {
                        if (filePath.startsWith(source)) yield filePath;
                    }
                }
                if (source.startsWith(cachePath)) {
                    yield `${cachePath}/${currentYear}-01-01T00.ndjson`;
                    yield `${cachePath}/${currentYear}-01-01T03.ndjson`;
                }
            });

        await handler();

        // Get the expected number of writes to be called
        const maxDate = getMaxDate().getTime();
        let expectedCount = 0;
        for (const hour of dateByHour(LogStartDate.getTime())) {
            if (hour >= maxDate || expectedCount > MaxToProcess) break;
            expectedCount++;
        }

        // Two files are already processed
        o(writeStub.callCount).equals(Math.min(expectedCount - 1, MaxToProcess));

        o(writeStub.args[0][0]).equals(`${cachePath}/${currentYear}-01-01T01.ndjson`);
        o(writeStub.args[0][1].toString()).equals('');

        o(writeStub.args[1][0]).equals(`${cachePath}/${currentYear}-01-01T02.ndjson`);
        o(writeStub.args[1][1].toString()).notEquals('');

        // Should write empty files when data is not found
        o(writeStub.args[2][0]).equals(`${cachePath}/${currentYear}-01-01T04.ndjson`);
        o(writeStub.args[2][1].toString()).equals('');

        o(writeStub.args[3][0]).equals(`${cachePath}/${currentYear}-01-01T05.ndjson`);
        o(writeStub.args[3][1].toString()).equals('');

        // Will do lots of lists upto todays date to find more data
        o(listStub.callCount > 100).equals(true);

        o(listStub.args[0][0]).equals(`s3://analytics-cache/RollUpV${RollupVersion}/${currentYear}/`);
        o(listStub.args[1][0]).equals(`s3://cloudfront-logs/E1WKYJII8YDTO0.${currentYear}-01-01-01`);
        o(listStub.args[2][0]).equals(`s3://cloudfront-logs/E1WKYJII8YDTO0.${currentYear}-01-01-02`);
        o(listStub.args[3][0]).equals(`s3://cloudfront-logs/E1WKYJII8YDTO0.${currentYear}-01-01-04`);
        o(listStub.args[4][0]).equals(`s3://cloudfront-logs/E1WKYJII8YDTO0.${currentYear}-01-01-05`);
    });
});
