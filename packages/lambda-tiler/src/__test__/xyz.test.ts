import { TileMatrixSets } from '@basemaps/geo';
import { Config, Env, LogConfig, VNodeParser } from '@basemaps/shared';
import { round } from '@basemaps/test/build/rounding';
import o from 'ospec';
import { ConfigProvider } from 'packages/config/src/config/provider';
import { handleRequest } from '../index';
import { TileComposer } from '../routes/tile';
import { TileEtag } from '../routes/tile.etag';
import { TileSets } from '../tile.set.cache';
import { FakeTileSet, mockRequest, Provider } from './xyz.util';

const TileSetNames = ['aerial', 'aerial@head', 'aerial@beta', '01E7PJFR9AMQFJ05X9G7FQ3XMW'];
/* eslint-disable @typescript-eslint/explicit-function-return-type */
o.spec('LambdaXyz', () => {
    /** Generate mock ALBEvent */

    let rasterMock = o.spy();
    const generateMock = o.spy(() => 'foo');
    const rasterMockBuffer = Buffer.from([1]);
    const origTileEtag = TileEtag.generate;
    const origCompose = TileComposer.compose;

    o.beforeEach(() => {
        LogConfig.disable();
        // tileMock = o.spy(() => tileMockData) as any;
        rasterMock = o.spy(() => {
            return {
                buffer: rasterMockBuffer,
            };
        }) as any;

        TileEtag.generate = generateMock;
        TileComposer.compose = rasterMock as any;

        const allMatrix = [...TileMatrixSets.All.values()];
        for (const tileSetName of TileSetNames) {
            for (const tileMatrix of allMatrix) {
                const tileSet = new FakeTileSet(tileSetName, tileMatrix);
                TileSets.add(tileSet);
                tileSet.getTiffsForTile = (): [] => [];
                tileSet.initTiffs = async () => [];
            }
        }

        (Config.Provider as any).get = async (): Promise<ConfigProvider> => Provider;
    });

    o.afterEach(() => {
        TileSets.cache.clear();
        TileComposer.compose = origCompose;
        TileEtag.generate = origTileEtag;
    });

    o('should export handler', async () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const base = require('../index');
        o(typeof base.handler).equals('function');
    });

    TileSetNames.forEach((tileSetName) => {
        o(`should generate a tile 0,0,0 for ${tileSetName}.png`, async () => {
            o.timeout(200);
            const request = mockRequest(`/v1/tiles/${tileSetName}/global-mercator/0/0/0.png`);
            const res = await handleRequest(request);
            o(res.status).equals(200);
            o(res.header('content-type')).equals('image/png');
            o(res.header('eTaG')).equals('foo');
            o(res.getBody()).equals(rasterMockBuffer.toString('base64'));

            // Validate the session information has been set correctly
            o(request.logContext['tileSet']).equals(tileSetName);
            o(request.logContext['xyz']).deepEquals({ x: 0, y: 0, z: 0 });
            o(round(request.logContext['location'])).deepEquals({ lat: 0, lon: 0 });
        });
    });

    o('should generate a tile 0,0,0 for webp', async () => {
        const request = mockRequest('/v1/tiles/aerial/3857/0/0/0.webp');
        const res = await handleRequest(request);
        o(res.status).equals(200);
        o(res.header('content-type')).equals('image/webp');
        o(res.header('eTaG')).equals('foo');
        o(res.getBody()).equals(rasterMockBuffer.toString('base64'));

        // Validate the session information has been set correctly
        o(request.logContext['xyz']).deepEquals({ x: 0, y: 0, z: 0 });
        o(round(request.logContext['location'])).deepEquals({ lat: 0, lon: 0 });
    });

    ['png', 'webp', 'jpeg'].forEach((fmt) => {
        o(`should 200 with empty ${fmt} if a tile is out of bounds`, async () => {
            // tiler.tile = async () => [];
            const res = await handleRequest(mockRequest(`/v1/tiles/aerial/global-mercator/0/0/0.${fmt}`));
            o(res.status).equals(200);
            o(res.header('content-type')).equals(`image/${fmt}`);
            o(rasterMock.calls.length).equals(1);
        });
    });

    o('should 304 if a tile is not modified', async () => {
        const key = 'foo';
        const request = mockRequest('/v1/tiles/aerial/global-mercator/0/0/0.png', 'get', { 'if-none-match': key });
        const res = await handleRequest(request);
        o(res.status).equals(304);
        o(res.header('eTaG')).equals(undefined);

        o(rasterMock.calls.length).equals(0);
        o(request.logContext['cache']).deepEquals({ key, match: key, hit: true });
    });

    o('should 404 if a tile is outside of the range', async () => {
        try {
            const res = await handleRequest(mockRequest('/v1/tiles/aerial/global-mercator/25/0/0.png', 'get'));
            o(res.status).equals(404);
        } catch (e) {
            o(e.status).equals(404);
        }
        try {
            const res = await handleRequest(mockRequest('/v1/tiles/aerial/2193/17/0/0.png', 'get'));
            o(res.status).equals(404);
        } catch (e) {
            o(e.status).equals(404);
        }
    });

    o.spec('WMTSCapabilities', () => {
        const origPublicUrlBase = process.env[Env.PublicUrlBase];
        o.after(() => {
            process.env[Env.PublicUrlBase] = origPublicUrlBase;
        });

        o('should 304 if a xml is not modified', async () => {
            o.timeout(1000);
            const key = 'r3vqprE8cfTtd4j83dllmDeZydOBMv5hlan0qR/fGkc=';
            const request = mockRequest('/v1/tiles/WMTSCapabilities.xml', 'get', { 'if-none-match': key });

            const res = await handleRequest(request);
            if (res.status === 200) {
                o(res.header('eTaG')).equals(key); // this line is useful for discovering the new etag
                return;
            }

            o(res.status).equals(304);
            o(rasterMock.calls.length).equals(0);

            o(request.logContext['cache']).deepEquals({ key, match: key, hit: true });
        });

        o('should serve WMTSCapabilities for tile_set', async () => {
            console.log('\n\nTestStart');
            process.env[Env.PublicUrlBase] = 'https://tiles.test';

            const request = mockRequest('/v1/tiles/aerial@beta/WMTSCapabilities.xml');
            request.apiKey = 'secretKey';

            const res = await handleRequest(request);
            o(res.status).equals(200);
            o(res.header('content-type')).equals('text/xml');
            o(res.header('cache-control')).equals('max-age=0');

            const body = Buffer.from(res.getBody() ?? '', 'base64').toString();
            o(body.slice(0, 100)).equals(
                '<?xml version="1.0"?>\n' +
                    '<Capabilities xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.op',
            );

            const vdom = await VNodeParser.parse(body);
            const url = vdom.tags('ResourceURL').next().value;
            o(url?.toString()).equals(
                '<ResourceURL format="image/jpeg" resourceType="tile" ' +
                    'template="https://tiles.test/v1/tiles/aerial@beta/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.jpeg?api=secretKey" />',
            );
        });
    });

    o.spec('tileJson', () => {
        const origPublicUrlBase = process.env[Env.PublicUrlBase];
        o.after(() => {
            process.env[Env.PublicUrlBase] = origPublicUrlBase;
        });

        o('should 304 if a json is not modified', async () => {
            const key = 'FlMeQJMKbBO4nMFOEC4/PG6wzFniA0uXfAxXkbV4L9g=';
            const request = mockRequest('/v1/tiles/tile.json', 'get', { 'if-none-match': key });

            const res = await handleRequest(request);
            if (res.status === 200) {
                o(res.header('eTaG')).equals(key); // this line is useful for discovering the new etag
                return;
            }

            o(res.status).equals(304);
            o(rasterMock.calls.length).equals(0);

            o(request.logContext['cache']).deepEquals({ key, match: key, hit: true });
        });

        o('should serve tile json for tile_set', async () => {
            process.env[Env.PublicUrlBase] = 'https://tiles.test';

            const request = mockRequest('/v1/tiles/topolike/Google/tile.json');
            request.apiKey = 'secretKey';

            const res = await handleRequest(request);
            o(res.status).equals(200);
            o(res.header('content-type')).equals('application/json');
            o(res.header('cache-control')).equals('max-age=120');

            const body = Buffer.from(res.getBody() ?? '', 'base64').toString();
            o(JSON.parse(body)).deepEquals({
                tiles: ['https://tiles.test/v1/tiles/topolike/Google/{z}/{x}/{y}.pbf?api=secretKey'],
                minzoom: 0,
                maxzoom: 15,
                format: 'pbf',
                tilejson: '2.0.0',
            });
        });
    });

    ['/favicon.ico', '/index.html', '/foo/bar'].forEach((path) => {
        o('should error on invalid paths: ' + path, async () => {
            const res = await handleRequest(mockRequest(path));
            o(res.status).equals(404);
        });
    });
});
