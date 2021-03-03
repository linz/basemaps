import { Epsg } from '@basemaps/geo';
import { ImageFormat } from '@basemaps/tiler';
import o from 'ospec';
import { tileAttributionFromPath, TileType, tileWmtsFromPath, tileXyzFromPath } from '../api.path';

o.spec('api.path', () => {
    o('tileXyzFromPath', () => {
        o(tileXyzFromPath(['aerial', 'EPSG:3857', '10', '3456', '5432.webp'])).deepEquals({
            type: TileType.Image,
            name: 'aerial',
            projection: Epsg.Google,
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
            projection: Epsg.Google,
        });

        o(tileWmtsFromPath([])).deepEquals({
            type: TileType.WMTS,
            name: '',
            projection: null,
        });
    });

    o('tileAttributionFromPath', () => {
        o(tileAttributionFromPath(['aerial', 'EPSG:3857', 'attribution.json'])).deepEquals({
            type: TileType.Attribution,
            name: 'aerial',
            projection: Epsg.Google,
        });

        o(tileAttributionFromPath([])).equals(null);
        o(tileAttributionFromPath(['aerial', 'attribution.json'])).equals(null);
    });
});
