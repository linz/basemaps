import { Epsg, TileMatrixSet } from '@basemaps/geo';
import { GoogleTms } from '@basemaps/geo/build/tms/google';
import {
    Aws,
    Env,
    LogConfig,
    TileMetadataProviderRecord,
    VNodeParser,
    ProjectionTileMatrixSet,
} from '@basemaps/shared';
import { round } from '@basemaps/test/build/rounding';
import { Tiler } from '@basemaps/tiler';
import o from 'ospec';
import { handleRequest } from '../index';
import { TileComposer } from '../routes/tile';
import { TileEtag } from '../routes/tile.etag';
import { TileSets } from '../tile.set.cache';
import { Tilers } from '../tiler';
import { FakeTileSet, mockRequest, Provider } from './xyz.util';

const TileSetNames = ['aerial', 'aerial@head', 'aerial@beta', '01E7PJFR9AMQFJ05X9G7FQ3XMW'];
/* eslint-disable @typescript-eslint/explicit-function-return-type */
o.spec('LambdaXyz', () => {
    /** Generate mock ALBEvent */

    let tileMock = o.spy();
    let rasterMock = o.spy();
    const generateMock = o.spy(() => 'foo');
    let tiler: Tiler = new Tiler(GoogleTms);
    const rasterMockBuffer = Buffer.from([1]);
    const origTileEtag = TileEtag.generate;
    const origCompose = TileComposer.compose;
    const tileMockData = [{ tiff: { source: { name: 'TileMock' } } }];

    o.beforeEach(() => {
        LogConfig.disable();
        tileMock = o.spy(() => tileMockData) as any;
        rasterMock = o.spy(() => {
            return {
                buffer: rasterMockBuffer,
            };
        }) as any;

        TileEtag.generate = generateMock;
        // Mock the tile generation
        tiler = new Tiler(GoogleTms);
        Tilers.add(tiler);
        tiler.tile = tileMock as any;
        TileComposer.compose = rasterMock as any;

        for (const tileSetName of TileSetNames) {
            for (const code of ProjectionTileMatrixSet.targetCodes()) {
                const tileSet = new FakeTileSet(tileSetName, Epsg.get(code));
                TileSets.set(tileSet.id, tileSet);
                tileSet.load = () => Promise.resolve(true);
                tileSet.getTiffsForTile = (): [] => [];
            }
        }

        (Aws.tileMetadata.Provider as any).get = async (): Promise<TileMetadataProviderRecord> => Provider;
    });

    o.afterEach(() => {
        TileSets.clear();
        Tilers.reset();
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
            const request = mockRequest(`/v1/tiles/${tileSetName}/global-mercator/0/0/0.png`);
            const res = await handleRequest(request);
            o(res.status).equals(200);
            o(res.header('content-type')).equals('image/png');
            o(res.header('eTaG')).equals('foo');
            o(res.getBody()).equals(rasterMockBuffer.toString('base64'));
            o(generateMock.args).deepEquals([
                tileMockData,
                {
                    type: 'image',
                    name: tileSetName,
                    projection: Epsg.Google,
                    x: 0,
                    y: 0,
                    z: 0,
                    ext: 'png',
                    altTms: undefined,
                },
            ] as any);

            o(tileMock.calls.length).equals(1);
            const [tiffs, x, y, z] = tileMock.args;
            o(tiffs).deepEquals([]);
            o(x).equals(0);
            o(y).equals(0);
            o(z).equals(0);

            // Validate the session information has been set correctly
            o(request.logContext['tileSet']).equals(tileSetName);
            o(request.logContext['xyz']).deepEquals({ x: 0, y: 0, z: 0 });
            o(round(request.logContext['location'])).deepEquals({ lat: 0, lon: 0 });
        });
    });

    o(`should generate a tile 0,0,0 for alternate tms`, async () => {
        tiler = Object.create(Tilers.get(Epsg.Nztm2000, 'agol')!);
        Tilers.map.set(TileMatrixSet.getId(Epsg.Nztm2000, 'agol'), tiler);
        tiler.tile = tileMock as any;
        const tileSet = new FakeTileSet('aerial', Epsg.Nztm2000);
        TileSets.set(tileSet.id, tileSet);
        tileSet.load = () => Promise.resolve(true);
        tileSet.getTiffsForTile = (): [] => [];
        const request = mockRequest(`/v1/tiles/aerial/EPSG:2193:agol/0/0/0.png`);
        const res = await handleRequest(request);
        o(res.status).equals(200);
        o(res.header('content-type')).equals('image/png');
        o(res.header('eTaG')).equals('foo');
        o(res.getBody()).equals(rasterMockBuffer.toString('base64'));
        o(generateMock.args).deepEquals([
            tileMockData,
            {
                type: 'image',
                name: 'aerial',
                projection: Epsg.Nztm2000,
                x: 0,
                y: 0,
                z: 0,
                ext: 'png',
                altTms: 'agol',
            },
        ] as any);

        o(tileMock.calls.length).equals(1);
        const [tiffs, x, y, z] = tileMock.args;
        o(tiffs).deepEquals([]);
        o(x).equals(0);
        o(y).equals(0);
        o(z).equals(0);

        // Validate the session information has been set correctly
        o(request.logContext['tileSet']).equals('aerial');
        o(request.logContext['xyz']).deepEquals({ x: 0, y: 0, z: 0 });
        o(round(request.logContext['location'])).deepEquals({ lat: -90, lon: 0 });
    });

    o('should generate a tile 0,0,0 for webp', async () => {
        const request = mockRequest('/v1/tiles/aerial/3857/0/0/0.webp');
        const res = await handleRequest(request);
        o(res.status).equals(200);
        o(res.header('content-type')).equals('image/webp');
        o(res.header('eTaG')).equals('foo');
        o(res.getBody()).equals(rasterMockBuffer.toString('base64'));

        o(tileMock.calls.length).equals(1);
        const [tiffs, x, y, z] = tileMock.args;
        o(tiffs).deepEquals([]);
        o(x).equals(0);
        o(y).equals(0);
        o(z).equals(0);

        // Validate the session information has been set correctly
        o(request.logContext['xyz']).deepEquals({ x: 0, y: 0, z: 0 });
        o(round(request.logContext['location'])).deepEquals({ lat: 0, lon: 0 });
    });

    ['png', 'webp', 'jpeg'].forEach((fmt) => {
        o(`should 200 with empty ${fmt} if a tile is out of bounds`, async () => {
            tiler.tile = async () => [];
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

        o(tileMock.calls.length).equals(1);
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
            const key = 'r3vqprE8cfTtd4j83dllmDeZydOBMv5hlan0qR/fGkc=';
            const request = mockRequest('/v1/tiles/WMTSCapabilities.xml', 'get', { 'if-none-match': key });

            const res = await handleRequest(request);
            if (res.status == 200) {
                o(res.header('eTaG')).equals(key); // this line is useful for discovering the new etag
                return;
            }

            o(res.status).equals(304);
            o(rasterMock.calls.length).equals(0);

            o(request.logContext['cache']).deepEquals({ key, match: key, hit: true });
        });

        o('should serve WMTSCapabilities for tile_set', async () => {
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

    ['/favicon.ico', '/index.html', '/foo/bar'].forEach((path) => {
        o('should error on invalid paths: ' + path, async () => {
            const res = await handleRequest(mockRequest(path));
            o(res.status).equals(404);
        });
    });
});
