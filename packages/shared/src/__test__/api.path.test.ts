import { GoogleTms, Nztm2000Tms } from '@basemaps/geo';
import { ImageFormat } from '@basemaps/tiler';
import o from 'ospec';
import { tileAttributionFromPath, TileType, tileWmtsFromPath, tileXyzFromPath } from '../api.path';

o.spec('api.path', () => {
    o('tileXyzFromPath', () => {
        o(tileXyzFromPath(['aerial', 'EPSG:3857', '10', '3456', '5432.webp'])).deepEquals({
            type: TileType.Image,
            name: 'aerial',
            tileMatrix: GoogleTms,
            x: 3456,
            y: 5432,
            z: 10,
            ext: ImageFormat.WEBP,
        });
        o(tileXyzFromPath([])).equals(null);
        o(tileXyzFromPath(['aerial', 'EPSG:3857', '10', '3456'])).equals(null);
    });

    o('tileWmtsFromPath', () => {
        o(tileWmtsFromPath(['aerial', 'EPSG:3857', 'WMTSCapabilities.xml'])).deepEquals({
            type: TileType.WMTS,
            name: 'aerial',
            tileMatrix: GoogleTms,
        });
        o(tileWmtsFromPath(['aerial', 'EPSG:2193', 'WMTSCapabilities.xml'])).deepEquals({
            type: TileType.WMTS,
            name: 'aerial',
            tileMatrix: Nztm2000Tms,
        });

        o(tileWmtsFromPath(['aerial', 'NZTM2000', 'WMTSCapabilities.xml'])).deepEquals({
            type: TileType.WMTS,
            name: 'aerial',
            tileMatrix: Nztm2000Tms,
        });

        o(tileWmtsFromPath(['aerial', 'WebMercatorQuad', 'WMTSCapabilities.xml'])).deepEquals({
            type: TileType.WMTS,
            name: 'aerial',
            tileMatrix: GoogleTms,
        });

        o(tileWmtsFromPath([])).deepEquals({
            type: TileType.WMTS,
            name: '',
            tileMatrix: null,
        });
    });

    o('tileAttributionFromPath', () => {
        o(tileAttributionFromPath(['aerial', 'EPSG:3857', 'attribution.json'])).deepEquals({
            type: TileType.Attribution,
            name: 'aerial',
            tileMatrix: GoogleTms,
        });

        o(tileAttributionFromPath([])).equals(null);
        o(tileAttributionFromPath(['aerial', 'attribution.json'])).equals(null);
    });
});
