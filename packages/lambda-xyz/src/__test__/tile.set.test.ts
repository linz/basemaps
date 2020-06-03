import { TileMetadataImageryRecord } from '@basemaps/shared';
import * as o from 'ospec';
import { TileSet } from '../tile.set';

o.spec('tile.set', () => {
    o('basePath', () => {
        const rec = { uri: 's3://test-bucket/3857/aerail/job123' } as TileMetadataImageryRecord;
        o(TileSet.basePath(rec)).equals('s3://test-bucket/3857/aerail/job123');
        o(TileSet.basePath(rec, '31223')).equals('s3://test-bucket/3857/aerail/job123/31223.tiff');
    });
});
