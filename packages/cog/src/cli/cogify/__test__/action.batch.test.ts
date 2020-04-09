import 'source-map-support/register';

import * as o from 'ospec';
import { CogJob } from '../../../cog/cog';
import { extractResolutionFromName, extractYearFromName, createImageryRecordFromJob } from '../action.batch';

o.spec('action.cog', () => {
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
        o(extractResolutionFromName('abc2017def_1.00m')).equals(1000);
        o(extractResolutionFromName('wellington_urban_2017_0.10m')).equals(100);
        o(extractResolutionFromName('wellington_urban_2017_0-10m')).equals(100);
        o(extractResolutionFromName('wellington_urban_2017_1.00m')).equals(1000);
        o(extractResolutionFromName('wellington_urban_2017_0.025m')).equals(25);
    });

    o('createImageryRecordFromJob', () => {
        const origNow = Date.now;

        const job: CogJob = {
            id: 'abc123',
            name: '2019-new-zealand-sentinel',
            projection: 3857,
            source: {
                resolution: 13,
            },
            output: {},
            quadkeys: ['311333222331', '311333223200', '311333223202', '3113332223131'],
        } as CogJob;

        const mockNow = Date.now();
        try {
            Date.now = (): number => mockNow;

            const imagery = createImageryRecordFromJob(job);

            o(imagery).deepEquals({
                id: 'im_abc123',
                name: '2019-new-zealand-sentinel',
                createdAt: mockNow,
                updatedAt: mockNow,
                projection: 3857,
                year: 2019,
                resolution: -1,
                quadKeys: ['311333222331', '311333223200', '311333223202', '3113332223131'],
            });
        } finally {
            Date.now = origNow;
        }
    });
});
