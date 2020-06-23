import o from 'ospec';
import { WindowUrl, MapOptionType } from '../url';
import { Epsg } from '@basemaps/geo';

o.spec('WindowUrl', () => {
    const googleLoc = { lat: 174.7763921, lon: -41.277848, zoom: 8 };

    o('should encode lon lat', () => {
        const output = WindowUrl.toHash(googleLoc);
        o(output).equals('#@174.7763921,-41.277848,z8');
        o(WindowUrl.fromHash(output)).deepEquals(googleLoc);
    });

    o('should extract information', () => {
        o(WindowUrl.fromUrl('')).deepEquals({
            projection: Epsg.Google,
            imageId: 'aerial',
            tag: 'production',
        });
        o(WindowUrl.fromUrl('?p=2193')).deepEquals({
            projection: Epsg.Nztm2000,
            imageId: 'aerial',
            tag: 'production',
        });
        o(WindowUrl.fromUrl('?i=abc123')).deepEquals({
            projection: Epsg.Google,
            imageId: 'abc123',
            tag: 'production',
        });
        o(WindowUrl.fromUrl('?v=beta')).deepEquals({
            projection: Epsg.Google,
            imageId: 'aerial',
            tag: 'beta',
        });
        o(WindowUrl.fromUrl('?v=beta&i=abc123&p=2193')).deepEquals({
            projection: Epsg.Nztm2000,
            imageId: 'abc123',
            tag: 'beta',
        });
        o(WindowUrl.fromUrl('?v=beta&i=abc123&p=2193&d=true')).deepEquals({
            projection: Epsg.Nztm2000,
            imageId: 'abc123',
            tag: 'beta',
        });
    });

    o('should convert to a url', () => {
        const options = WindowUrl.fromUrl('');
        o(WindowUrl.toTileUrl(options, MapOptionType.Tile)).equals('/v1/tiles/aerial/3857/{z}/{x}/{y}.webp');
        o(WindowUrl.toTileUrl(options, MapOptionType.Wmts)).equals('/v1/tiles/aerial/3857/WMTSCapabilities.xml');
        o(WindowUrl.toTileUrl(options, MapOptionType.TileWmts)).equals(
            '/v1/tiles/aerial/3857/{TileMatrix}/{TileCol}/{TileRow}.webp',
        );
    });
    o('should convert to a url with api key', () => {
        const options = WindowUrl.fromUrl('');

        process.env.API_KEY = 'abc123';
        o(WindowUrl.toTileUrl(options, MapOptionType.Tile)).equals('/v1/tiles/aerial/3857/{z}/{x}/{y}.webp?api=abc123');
        o(WindowUrl.toTileUrl(options, MapOptionType.Wmts)).equals(
            '/v1/tiles/aerial/3857/WMTSCapabilities.xml?api=abc123',
        );
        o(WindowUrl.toTileUrl(options, MapOptionType.TileWmts)).equals(
            '/v1/tiles/aerial/3857/{TileMatrix}/{TileCol}/{TileRow}.webp?api=abc123',
        );
        delete process.env.API_KEY;
    });

    o('should convert to a url with baseUrl', () => {
        const options = WindowUrl.fromUrl('');

        process.env.TILE_HOST = 'https://foo.bar.com';
        o(WindowUrl.toTileUrl(options, MapOptionType.Tile)).equals(
            'https://foo.bar.com/v1/tiles/aerial/3857/{z}/{x}/{y}.webp',
        );
        o(WindowUrl.toTileUrl(options, MapOptionType.Wmts)).equals(
            'https://foo.bar.com/v1/tiles/aerial/3857/WMTSCapabilities.xml',
        );
        o(WindowUrl.toTileUrl(options, MapOptionType.TileWmts)).equals(
            'https://foo.bar.com/v1/tiles/aerial/3857/{TileMatrix}/{TileCol}/{TileRow}.webp',
        );
        delete process.env.TILE_HOST;
    });
});
