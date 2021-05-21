import { TileSetType } from '@basemaps/config';
import { GoogleTms } from '@basemaps/geo';
import { Config } from '@basemaps/shared';
import o from 'ospec';
import sinon from 'sinon';
import { CogStacJob } from '../../../cog/cog.stac.job';
import { CogJobJson } from '../../../cog/types';
import { createImageryTileSet, extractResolutionFromName } from '../action.batch';

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

    const sandbox = sinon.createSandbox();

    o.afterEach(() => sandbox.restore());

    o('createImageryTileSet', async () => {
        const job = new CogStacJob({
            id: 'abc123',
            name: '2019-new-zealand-sentinel',
            title: 'job title',
            description: 'job description',
            output: {
                tileMatrix: GoogleTms.identifier,
            },
        } as CogJobJson);

        const putTileSet = sandbox.stub(Config.TileSet, 'put');

        await createImageryTileSet(job);

        o(putTileSet.getCall(0).args[0]).deepEquals({
            id: 'ts_abc123',
            createdAt: putTileSet.getCall(0).args[0].createdAt,
            updatedAt: putTileSet.getCall(0).args[0].createdAt,
            name: 'abc123',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
            layers: [{ 3857: 'im_abc123', name: '2019-new-zealand-sentinel', minZoom: 0, maxZoom: 32 }],
            title: 'job title',
            description: 'job description',
            type: TileSetType.Raster,
        });
    });
});
