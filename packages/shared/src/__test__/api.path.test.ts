import { GoogleTms, Nztm2000Tms, Nztm2000QuadTms } from '@basemaps/geo';
import { ImageFormat } from '@basemaps/tiler';
import o from 'ospec';
import { tileAttributionFromPath, TileType, tileWmtsFromPath, tileXyzFromPath, VectorFormat } from '../api.path.js';

o.spec('api.path', () => {
    o.spec('tileXyzFromPath', () => {
        o('should be case sensitive for tile matrix ids', () => {
            o(tileXyzFromPath(['aerial', 'NZTM2000quad', '10', '3456', '5432.webp'])).deepEquals(null);
        });

        o('should support only known extensions', () => {
            o(tileXyzFromPath(['aerial', 'NZTM2000Quad', '10', '3456', '5432.FAKE'])).deepEquals(null);
        });

        for (const ext of Object.values(ImageFormat)) {
            o('should support image format:' + ext, () => {
                o(tileXyzFromPath(['aerial', 'NZTM2000Quad', '10', '3456', '5432.' + ext])?.ext).equals(ext);
            });
        }

        o('should be case insensitive for file names', () => {
            o(tileWmtsFromPath(['aerial', 'NZTM2000Quad', 'wmtsCapabilities.XML'])).deepEquals({
                type: TileType.WMTS,
                name: 'aerial',
                tileMatrix: Nztm2000QuadTms,
            });
        });

        o('should parse tiles from path', () => {
            o(tileXyzFromPath(['aerial', 'EPSG:3857', '10', '3456', '5432.webp'])).deepEquals({
                type: TileType.Tile,
                name: 'aerial',
                tileMatrix: GoogleTms,
                x: 3456,
                y: 5432,
                z: 10,
                ext: ImageFormat.WEBP,
            });
            o(tileXyzFromPath([])).equals(null);
            o(tileXyzFromPath(['aerial', 'EPSG:3857', '10', '3456'])).equals(null);
            o(tileXyzFromPath(['aerial', 'NZTM2000Quad', '10', '3456', '5432.webp'])).deepEquals({
                type: TileType.Tile,
                name: 'aerial',
                tileMatrix: Nztm2000QuadTms,
                x: 3456,
                y: 5432,
                z: 10,
                ext: ImageFormat.WEBP,
            });
        });
        o('should parse vector tiles', () => {
            o(tileXyzFromPath(['aerial', 'NZTM2000Quad', '10', '3456', '5432.pbf'])).deepEquals({
                type: TileType.Tile,
                name: 'aerial',
                tileMatrix: Nztm2000QuadTms,
                x: 3456,
                y: 5432,
                z: 10,
                ext: VectorFormat.MapboxVectorTiles,
            });
        });
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

        o(tileWmtsFromPath(['aerial', 'NZTM2000Quad', 'WMTSCapabilities.xml'])).deepEquals({
            type: TileType.WMTS,
            name: 'aerial',
            tileMatrix: Nztm2000QuadTms,
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
