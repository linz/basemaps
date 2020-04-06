import { TileMetadataTable } from '@basemaps/lambda-shared';
import * as o from 'ospec';
import { CogJob } from '../../../cog/cog';
import { extractYearFromName, storeImage } from '../action.batch';

o.spec('action.cog', () => {
    o('extractYearFromName', () => {
        o(extractYearFromName('2013')).equals(2013);
        o(extractYearFromName('abc2017def')).equals(2017);
        o(extractYearFromName('2019_abc')).equals(2019);
        o(extractYearFromName('12019_abc')).equals(-1);
        o(extractYearFromName('2019_abc2020')).equals(2020);
        o(extractYearFromName('2020_abc2019')).equals(2020);
    });

    o('storeImage', () => {
        const origNow = Date.now;
        const origCreate = TileMetadataTable.prototype.create;

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
            const create = o.spy();
            Date.now = (): number => mockNow;
            TileMetadataTable.prototype.create = create as any;

            storeImage(job);

            o(create.args).deepEquals([
                {
                    id: 'im_abc123',
                    name: '2019-new-zealand-sentinel',
                    createdAt: mockNow,
                    updatedAt: mockNow,
                    projection: 3857,
                    year: 2019,
                    resolution: 13,
                    quadKeys: ['311333222331', '311333223200', '311333223202', '3113332223131'],
                },
            ]);
        } finally {
            TileMetadataTable.prototype.create = origCreate;
            Date.now = origNow;
        }
    });
});
