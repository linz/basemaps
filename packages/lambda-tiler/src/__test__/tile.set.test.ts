import { GoogleTms, Nztm2000QuadTms, Nztm2000Tms } from '@basemaps/geo';
import { TileMetadataImageryRecord } from '@basemaps/shared';
import o from 'ospec';
import { TileSet } from '../tile.set';

o.spec('tile.set', () => {
    o('basePath', () => {
        const rec = { uri: 's3://test-bucket/3857/aerail/job123' } as TileMetadataImageryRecord;
        o(TileSet.basePath(rec)).equals('s3://test-bucket/3857/aerail/job123');
        o(TileSet.basePath(rec, '31223')).equals('s3://test-bucket/3857/aerail/job123/31223.tiff');
    });

    o('should match the zoom levels from nztm2000', () => {
        const ts = new TileSet('Nztm2000', Nztm2000Tms);
        for (let i = 0; i < Nztm2000Tms.maxZoom; i++) {
            o(ts.getDefaultZoomLevel(i)).equals(i);
        }
    });

    o('should match the zoom levels from google', () => {
        const ts = new TileSet('Google', GoogleTms);
        for (let i = 0; i < GoogleTms.maxZoom; i++) {
            o(ts.getDefaultZoomLevel(i)).equals(i);
        }
    });

    o('should match zoom levels outside of the range of the target z', () => {
        const ts = new TileSet('Nztm2000Quad', Nztm2000QuadTms);
        o(ts.getDefaultZoomLevel(22)).equals(16);
        o(ts.getDefaultZoomLevel(21)).equals(16);
        o(ts.getDefaultZoomLevel(20)).equals(16);
    });

    o('should match the zoom levels from nztm2000 when using nztm2000quad', () => {
        const ts = new TileSet('Nztm2000Quad', Nztm2000QuadTms);
        o(ts.getDefaultZoomLevel(13)).equals(11);
        o(ts.getDefaultZoomLevel(12)).equals(10);
        o(ts.getDefaultZoomLevel(6)).equals(4);
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
