import { Bounds, EpsgCode } from '@basemaps/geo';
import { Aws, NamedBounds } from '@basemaps/shared';
import { qkToNamedBounds } from '@basemaps/shared/build/proj/__test__/test.util';
import { round } from '@basemaps/test/build/rounding';
import o from 'ospec';
import { CogJobJson } from '../../../cog/types';
import { CogStacJob } from '../../../cog/cog.stac.job';
import { createImageryRecordFromJob, createMetadataFromJob, extractResolutionFromName } from '../action.batch';

o.spec('action.batch', () => {
    o('extractResolutionFromName', () => {
        o(extractResolutionFromName('2013')).equals(-1);
        o(extractResolutionFromName('new_zealand_sentinel_2018-19_10m')).equals(10000);
        o(extractResolutionFromName('abc2017def_1.00m')).equals(1000);
        o(extractResolutionFromName('wellington_urban_2017_0.10m')).equals(100);
        o(extractResolutionFromName('wellington_urban_2017_0-10m')).equals(100);
        o(extractResolutionFromName('wellington_urban_2017_1.00m')).equals(1000);
        o(extractResolutionFromName('wellington_urban_2017_0.025m')).equals(25);
    });

    o.spec('metadata', () => {
        const origNow = Date.now;

        const files = round(qkToNamedBounds(['311333222331', '311333223200', '311333223202', '3113332223131']), 4);

        const job = new CogStacJob({
            id: 'abc123',

            name: '2019-new-zealand-sentinel',
            title: 'job title',
            description: 'job description',

            source: {
                epsg: EpsgCode.Nztm2000,
                gsd: 1,
                files: [] as NamedBounds[],
            },
            output: {
                epsg: EpsgCode.Google,
                files: files.slice(),
                addAlpha: true,
                bounds: round(Bounds.union(files).toJson(), 4),
                location: { path: 's3://test-bucket' },
            },
        } as CogJobJson);

        const { tileMetadata } = Aws;

        o.afterEach(() => {
            Aws.tileMetadata = tileMetadata;
        });

        o('createMetadataFromJob', async () => {
            const put = o.spy();
            const create = o.spy();
            Aws.tileMetadata = {
                put,
                TileSet: { create, initialRecord: tileMetadata.TileSet.initialRecord },
            } as any;

            await createMetadataFromJob(job);

            o(put.args[0].projection).equals(3857);

            o(create.args).deepEquals([
                {
                    id: '',
                    createdAt: create.args[0].createdAt,
                    updatedAt: 0,
                    version: 0,
                    revisions: 0,
                    v: 2,
                    name: 'abc123',
                    projection: 3857,
                    background: { r: 0, g: 0, b: 0, alpha: 0 },
                    rules: [
                        {
                            imgId: 'im_abc123',
                            ruleId: 'im_abc123',
                            minZoom: 0,
                            maxZoom: 32,
                            priority: 1000,
                        },
                    ],
                    title: 'job title',
                    description: 'job description',
                },
            ]);
        });

        o('createImageryRecordFromJob', () => {
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
});
