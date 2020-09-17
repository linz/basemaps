import { Env, LogConfig } from '@basemaps/shared';
import o from 'ospec';
import { createSandbox } from 'sinon';
import { FileProcess } from '../file.process';
import { dateByHour, FirstLog, getStartDate, handler, s3fs } from '../index';
import { ExampleLogs, lineReader } from './file.process.test';

LogConfig.get().level = 'silent';

o.spec('hourByHour', () => {
    const firstLogHour = (hour: number): string => FirstLog.replace('T00', 'T' + hour.toString().padStart(2, '0'));
    o('should start around 2020-08-07', () => {
        const startDate = new Date(FirstLog).getTime();
        const iter = dateByHour(startDate);
        for (let i = 0; i < 5; i++) {
            o(firstLogHour(i + 1)).equals(new Date(iter.next().value).toISOString());
        }
    });

    o('should work for thousands of hours', () => {
        const startDate = new Date(FirstLog).getTime();
        const iter = dateByHour(startDate);
        let startHour = 1;
        let lastDate = startDate;
        // Loop over the next 10,000 hours and verify we always increase by one UTC hour
        // I have manually run this for 10,000,000 hours and seems to work (about 1000 years)
        for (let i = 0; i < 10000; i++) {
            const nextDate = new Date(iter.next().value);
            const timeInc = nextDate.getTime() - lastDate;
            lastDate = nextDate.getTime();

            o(nextDate.getUTCHours()).equals(startHour)(`${i} - ${nextDate.toISOString()}`);
            o(timeInc).equals(60 * 60 * 1000);
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
        s3fs.list = (): Promise<any> => Promise.resolve([]);
        const startDate = await getStartDate('s3://foo/bar');
        o(new Date(startDate).toISOString()).equals(FirstLog);
    });

    o('should not use the start date if files are found', async () => {
        s3fs.list = (): Promise<any> => Promise.resolve(['s3://foo/bar/baz.txt', 's3://foo/bar/2020-10-10T10.ndjson']);
        const startDate = await getStartDate('s3://foo/bar');
        o(new Date(startDate).toISOString()).equals(`2020-10-10T10:00:00.000Z`);
    });

    o('should ignore old files found', async () => {
        s3fs.list = (): Promise<any> => Promise.resolve(['s3://foo/bar/baz.txt', 's3://foo/bar/2001-10-10T10.ndjson']);
        const startDate = await getStartDate('s3://foo/bar');
        o(new Date(startDate).toISOString()).equals(FirstLog);
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
        sandbox.stub(FileProcess, 'reader').callsFake(lineReader(ExampleLogs));
        const writeStub = sandbox.stub(s3fs, 'write');
        const listStub = sandbox.stub(s3fs, 'list').callsFake(
            async (source: string): Promise<string[]> => {
                if (source.startsWith(sourceBucket)) {
                    return [
                        `${sourceBucket}/${cloudFrontId}.2020-07-28-00.hash.gz`,
                        `${sourceBucket}/${cloudFrontId}.2020-07-28-01.hash.gz`,
                        `${sourceBucket}/${cloudFrontId}.2020-07-28-01.hashB.gz`,
                        `${sourceBucket}/${cloudFrontId}.2020-07-28-02.hash.gz`,
                        // Old
                        `${sourceBucket}/${cloudFrontId}.2019-07-28-02.hash.gz`,
                    ].filter((f) => f.startsWith(source));
                }
                return [];
            },
        );

        await handler();

        // Should write one cache file
        o(writeStub.callCount).equals(2);
        o(writeStub.args[0][0]).equals('s3://analytics-cache/RollUpV0/2020-07-28T01.ndjson');
        o(writeStub.args[1][0]).equals('s3://analytics-cache/RollUpV0/2020-07-28T02.ndjson');

        // Will do lots of lists upto todays date to find more data
        o(listStub.callCount > 100).equals(true);

        o(listStub.args[0][0]).equals('s3://analytics-cache/RollUpV0/');
        o(listStub.args[1][0]).equals('s3://cloudfront-logs/E1WKYJII8YDTO0.2020-07-28-01');
        o(listStub.args[2][0]).equals('s3://cloudfront-logs/E1WKYJII8YDTO0.2020-07-28-02');
        o(listStub.args[3][0]).equals('s3://cloudfront-logs/E1WKYJII8YDTO0.2020-07-28-03');
        o(listStub.args[4][0]).equals('s3://cloudfront-logs/E1WKYJII8YDTO0.2020-07-28-04');
    });
});
