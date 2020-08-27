import o from 'ospec';
import { WindowUrl, MapOptionType } from '../url';
import { Epsg } from '@basemaps/geo';
import { Config } from '../config';

declare const global: {
    window?: { location: { protocol: string; hostname: string } };
};

o.spec('WindowUrl', () => {
    o.beforeEach(() => {
        global.window = { location: { protocol: 'https:', hostname: 'basemaps.linz.govt.nz' } };
    });
    o.afterEach(() => {
        delete global.window;
    });
    const googleLoc = { lat: 174.7763921, lon: -41.277848, zoom: 8 };

    o.spec('Hash', () => {
        o('should encode lon lat', () => {
            const output = WindowUrl.toHash(googleLoc);
            o(output).equals('#@174.7763921,-41.277848,z8');
            o(WindowUrl.fromHash(output)).deepEquals(googleLoc);
            o(WindowUrl.fromHash('#@174.7763921,-41.277848,8z')).deepEquals(googleLoc);
        });

        o('should encode fractional zooms', () => {
            o(WindowUrl.fromHash('#@174.7763921,-41.277848,14.25z').zoom).deepEquals(14.25);
            o(WindowUrl.fromHash('#@174.7763921,-41.277848,z14.25').zoom).deepEquals(14.25);
        });

        o('should not fail if parts are missing', () => {
            const missingZoom = WindowUrl.fromHash('#@174.7763921,-41.277848,');
            o(missingZoom).deepEquals({ lat: googleLoc.lat, lon: googleLoc.lon });
            const missingParam = WindowUrl.fromHash('#@174.7763921,');
            o(missingParam).deepEquals({});
        });
    });

    o('should extract information', () => {
        o(WindowUrl.fromUrl('')).deepEquals({
            projection: Epsg.Google,
            imageId: 'aerial',
            tag: 'production',
            debug: false,
        });
        o(WindowUrl.fromUrl('?p=2193')).deepEquals({
            projection: Epsg.Nztm2000,
            imageId: 'aerial',
            tag: 'production',
            debug: false,
        });
        o(WindowUrl.fromUrl('?i=abc123')).deepEquals({
            projection: Epsg.Google,
            imageId: 'abc123',
            tag: 'production',
            debug: false,
        });
        o(WindowUrl.fromUrl('?v=beta')).deepEquals({
            projection: Epsg.Google,
            imageId: 'aerial',
            tag: 'beta',
            debug: false,
        });
        o(WindowUrl.fromUrl('?v=beta&i=abc123&p=2193')).deepEquals({
            projection: Epsg.Nztm2000,
            imageId: 'abc123',
            tag: 'beta',
            debug: false,
        });
        o(WindowUrl.fromUrl('?v=beta&i=abc123&p=2193&d=true')).deepEquals({
            projection: Epsg.Nztm2000,
            imageId: 'abc123',
            tag: 'beta',
            debug: false,
        });
        o(WindowUrl.fromUrl('?v=beta&i=abc123&p=2193&d=true&debug=yes')).deepEquals({
            projection: Epsg.Nztm2000,
            imageId: 'abc123',
            tag: 'beta',
            debug: true,
        });
    });

    o('should convert to a url', () => {
        const apiKey = Config.ApiKey;
        const options = WindowUrl.fromUrl('');
        o(WindowUrl.toTileUrl(options, MapOptionType.Tile)).equals(
            `https://basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:3857/{z}/{x}/{y}.png?api=${apiKey}`,
        );
        o(WindowUrl.toTileUrl(options, MapOptionType.Wmts)).equals(
            `https://basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:3857/WMTSCapabilities.xml?api=${apiKey}`,
        );
        o(WindowUrl.toTileUrl(options, MapOptionType.TileWmts)).equals(
            `https://basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:3857/{TileMatrix}/{TileCol}/{TileRow}.png?api=${apiKey}`,
        );
    });

    o('should convert to a url with baseUrl', () => {
        const options = WindowUrl.fromUrl('');
        const apiKey = Config.ApiKey;

        process.env.TILE_HOST = 'https://foo.bar.com';
        o(WindowUrl.toTileUrl(options, MapOptionType.Tile)).equals(
            `https://foo.bar.com/v1/tiles/aerial/EPSG:3857/{z}/{x}/{y}.png?api=${apiKey}`,
        );
        o(WindowUrl.toTileUrl(options, MapOptionType.Wmts)).equals(
            `https://foo.bar.com/v1/tiles/aerial/EPSG:3857/WMTSCapabilities.xml?api=${apiKey}`,
        );
        o(WindowUrl.toTileUrl(options, MapOptionType.TileWmts)).equals(
            `https://foo.bar.com/v1/tiles/aerial/EPSG:3857/{TileMatrix}/{TileCol}/{TileRow}.png?api=${apiKey}`,
        );

        WindowUrl.ImageFormat = 'webp';
        o(WindowUrl.toTileUrl(options, MapOptionType.TileWmts)).equals(
            `https://foo.bar.com/v1/tiles/aerial/EPSG:3857/{TileMatrix}/{TileCol}/{TileRow}.webp?api=${apiKey}`,
        );
        delete process.env.TILE_HOST;
    });
});
