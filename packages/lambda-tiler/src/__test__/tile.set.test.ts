import { ConfigImagery } from '@basemaps/config';
import { GoogleTms, Nztm2000Tms } from '@basemaps/geo';
import o from 'ospec';
import { TileSetRaster } from '../tile.set.raster';

o.spec('tile.set', () => {
    o('basePath', () => {
        const rec = { uri: 's3://test-bucket/3857/aerail/job123' } as ConfigImagery;
        o(TileSetRaster.basePath(rec)).equals('s3://test-bucket/3857/aerail/job123');
        o(TileSetRaster.basePath(rec, '31223')).equals('s3://test-bucket/3857/aerail/job123/31223.tiff');
    });

    o('extent', () => {
        o(new TileSetRaster('google', GoogleTms).extent.toBbox()).deepEquals([
            -20037508.3427892,
            -20037508.3427892,
            20037508.3427892,
            20037508.3427892,
        ]);
        o(new TileSetRaster('nztm', Nztm2000Tms).extent.toBbox()).deepEquals([274000, 3087000, 3327000, 7173000]);
    });
});
