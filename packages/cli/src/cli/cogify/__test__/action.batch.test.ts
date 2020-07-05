import o from 'ospec';
import { CogJob } from '../../../cog/types';
import { extractResolutionFromName, extractYearFromName, createImageryRecordFromJob } from '../action.batch';
import { qkToNamedBounds } from '@basemaps/shared/build/proj/__test__/test.util';
import { Bounds } from '@basemaps/geo';
import { round } from '@basemaps/test/build/rounding';

o.spec('action.batch', () => {
    o('extractYearFromName', () => {
        o(extractYearFromName('2013')).equals(2013);
        o(extractYearFromName('abc2017def')).equals(2017);
        o(extractYearFromName('2019_abc')).equals(2019);
        o(extractYearFromName('12019_abc')).equals(-1);
        o(extractYearFromName('2019_abc2020')).equals(2020);
        o(extractYearFromName('2020_abc2019')).equals(2020);
    });

    o('extractResolutionFromName', () => {
        o(extractResolutionFromName('2013')).equals(-1);
        o(extractResolutionFromName('new_zealand_sentinel_2018-19_10m')).equals(10000);
        o(extractResolutionFromName('abc2017def_1.00m')).equals(1000);
        o(extractResolutionFromName('wellington_urban_2017_0.10m')).equals(100);
        o(extractResolutionFromName('wellington_urban_2017_0-10m')).equals(100);
        o(extractResolutionFromName('wellington_urban_2017_1.00m')).equals(1000);
        o(extractResolutionFromName('wellington_urban_2017_0.025m')).equals(25);
    });

    o('createImageryRecordFromJob', () => {
        const origNow = Date.now;

        const files = round(qkToNamedBounds(['311333222331', '311333223200', '311333223202', '3113332223131']), 4);

        const job: CogJob = {
            id: 'abc123',
            name: '2019-new-zealand-sentinel',
            projection: 3857,
            source: {
                resZoom: 13,
            },
            output: { path: 's3://test-bucket' },
            bounds: round(Bounds.union(files).toJson(), 4),
            files: files.slice(),
        } as CogJob;

        const mockNow = Date.now();
        try {
            Date.now = (): number => mockNow;

            const imagery = round(createImageryRecordFromJob(job), 4);

            o(imagery).deepEquals({
                v: 1,
                id: 'im_abc123',
                name: '2019-new-zealand-sentinel',
                createdAt: mockNow,
                updatedAt: mockNow,
                uri: 's3://test-bucket/3857/2019-new-zealand-sentinel/abc123',
                projection: 3857,
                year: 2019,
                resolution: -1,
                bounds: round(Bounds.union(files).toJson(), 4),
                files,
            });
        } finally {
            Date.now = origNow;
        }
    });
});
