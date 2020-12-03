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
            altTms: undefined,
        });
        o(tileXyzFromPath([])).equals(null);
        o(tileXyzFromPath(['aerial', 'EPSG:3857', '10', '3456'])).equals(null);
        o(tileXyzFromPath(['aerial', 'EPSG:2193:agol', '10', '3456', '5432.webp'])).deepEquals({
            type: TileType.Image,
            name: 'aerial',
            projection: Epsg.Nztm2000,
            x: 3456,
            y: 5432,
            z: 10,
            ext: ImageFormat.WEBP,
            altTms: 'agol',
        });
    });

    o('tileWmtsFromPath', () => {
        o(tileWmtsFromPath(['aerial', 'EPSG:3857', 'WMTSCapabilities.xml'])).deepEquals({
            type: TileType.WMTS,
            name: 'aerial',
            projection: Epsg.Google,
            altTms: undefined,
        });
        o(tileWmtsFromPath(['aerial', 'EPSG:2193:agol', 'WMTSCapabilities.xml'])).deepEquals({
            type: TileType.WMTS,
            name: 'aerial',
            projection: Epsg.Nztm2000,
            altTms: 'agol',
        });
        o(tileWmtsFromPath([])).deepEquals({
            type: TileType.WMTS,
            name: '',
            projection: null,
            altTms: undefined,
        });
    });

    o('tileAttributionFromPath', () => {
        o(tileAttributionFromPath(['aerial', 'EPSG:3857', 'attribution.json'])).deepEquals({
            type: TileType.Attribution,
            name: 'aerial',
            projection: Epsg.Google,
            altTms: undefined,
        });
        o(tileAttributionFromPath(['aerial', 'EPSG:2193:agol', 'attribution.json'])).deepEquals({
            type: TileType.Attribution,
            name: 'aerial',
            projection: Epsg.Nztm2000,
            altTms: 'agol',
        });
        o(tileAttributionFromPath([])).equals(null);
        o(tileAttributionFromPath(['aerial', 'attribution.json'])).equals(null);
    });
});
