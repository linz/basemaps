import { GoogleTms, Nztm2000Tms } from '@basemaps/geo';
import { TileMetadataImageryRecord } from '@basemaps/shared';
import o from 'ospec';
import { TileSet } from '../tile.set';

o.spec('tile.set', () => {
    o('basePath', () => {
        const rec = { uri: 's3://test-bucket/3857/aerail/job123' } as TileMetadataImageryRecord;
        o(TileSet.basePath(rec)).equals('s3://test-bucket/3857/aerail/job123');
        o(TileSet.basePath(rec, '31223')).equals('s3://test-bucket/3857/aerail/job123/31223.tiff');
    });

    o('extent', () => {
        o(new TileSet('google', GoogleTms).extent.toBbox()).deepEquals([
            -20037508.3427892,
            -20037508.3427892,
            20037508.3427892,
            20037508.3427892,
        ]);

        o(new TileSet('nztm', Nztm2000Tms).extent.toBbox()).deepEquals([274000, 3087000, 3327000, 7173000]);
    });
});
