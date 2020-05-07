import { Env, LambdaContext, LogConfig } from '@basemaps/lambda-shared';
import { VNodeParser } from '@basemaps/lambda-shared';
import { Tiler } from '@basemaps/tiler';
import { TileMakerSharp } from '@basemaps/tiler-sharp';
import * as o from 'ospec';
import { handleRequest } from '../index';
import { Tilers } from '../tiler';
import { EPSG } from '@basemaps/geo';
import { TileSets } from '../routes/tile';
import { TileSet } from '../tile.set';

const TileSetNames = ['aerial', 'aerial@head', 'aerial@beta', '01E7PJFR9AMQFJ05X9G7FQ3XMW'];
/* eslint-disable @typescript-eslint/explicit-function-return-type */
o.spec('LambdaXyz', () => {
    /** Generate mock ALBEvent */
    function req(path: string, method = 'get', headers = {}): LambdaContext {
        return new LambdaContext(
            {
                requestContext: null as any,
                httpMethod: method.toUpperCase(),
                path,
                headers,
                body: null,
                isBase64Encoded: false,
            },
            LogConfig.get(),
        );
    }

    let tileMock = o.spy();
    let rasterMock = o.spy();
    const rasterMockBuffer = Buffer.from([1]);

    o.beforeEach(() => {
        LogConfig.disable();
        tileMock = o.spy(() => ['TileMock']) as any;
        rasterMock = o.spy(() => {
            return {
                buffer: rasterMockBuffer,
            };
        }) as any;

        // Mock the tile generation
        Tilers.tile256 = new Tiler(256);
        Tilers.tile256.tile = tileMock as any;
        Tilers.compose256 = { compose: rasterMock } as any;

        for (const tileSetName of TileSetNames) {
            const tileSet = new TileSet(tileSetName, EPSG.Google, 'bucket');
            TileSets.set(tileSet.id, tileSet);
            tileSet.load = () => Promise.resolve();
            tileSet.getTiffsForQuadKey = async (): Promise<[]> => [];
        }
    });

    o.afterEach(() => {
        TileSets.clear();
        Tilers.tile256 = new Tiler(256);
        Tilers.compose256 = new TileMakerSharp(256);
    });

    o('should export handler', async () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const base = require('../index');
        o(typeof base.handler).equals('function');
    });

    TileSetNames.forEach((tileSetName) => {
        o(`should generate a tile 0,0,0 for ${tileSetName}.png`, async () => {
            const request = req(`/v1/tiles/${tileSetName}/global-mercator/0/0/0.png`);
            const res = await handleRequest(request);
            o(res.status).equals(200);
            o(res.header('content-type')).equals('image/png');
            o(typeof res.header('eTaG')).equals('string');
            o(res.getBody()).equals(rasterMockBuffer.toString('base64'));

            o(tileMock.calls.length).equals(1);
            const [tiffs, x, y, z] = tileMock.args;
            o(tiffs).deepEquals([]);
            o(x).equals(0);
            o(y).equals(0);
            o(z).equals(0);

            // Validate the session information has been set correctly
            o(request.logContext['path']).equals(`/v1/tiles/${tileSetName}/global-mercator/0/0/0.png`);
            o(request.logContext['tileSet']).equals(tileSetName);
            o(request.logContext['method']).equals('get');
            o(request.logContext['xyz']).deepEquals({ x: 0, y: 0, z: 0 });
            o(request.logContext['location']).deepEquals({ lat: 0, lon: 0 });
        });
    });

    o('should generate a tile 0,0,0 for webp', async () => {
        const request = req('/v1/tiles/aerial/3857/0/0/0.webp');
        const res = await handleRequest(request);
        o(res.status).equals(200);
        o(res.header('content-type')).equals('image/webp');
        o(res.header('eTaG')).equals('9Iiu/i3ZzjiLKroRycpaD5eLk0BHUHX1hUsy0CCSoIM=');
        o(res.getBody()).equals(rasterMockBuffer.toString('base64'));

        o(tileMock.calls.length).equals(1);
        const [tiffs, x, y, z] = tileMock.args;
        o(tiffs).deepEquals([]);
        o(x).equals(0);
        o(y).equals(0);
        o(z).equals(0);

        // Validate the session information has been set correctly
        o(request.logContext['path']).equals('/v1/tiles/aerial/3857/0/0/0.webp');
        o(request.logContext['method']).equals('get');
        o(request.logContext['xyz']).deepEquals({ x: 0, y: 0, z: 0 });
        o(request.logContext['location']).deepEquals({ lat: 0, lon: 0 });
    });

    o('should 200 with empty png if a tile is out of bounds', async () => {
        Tilers.tile256.tile = async () => null;
        const res = await handleRequest(req('/v1/tiles/aerial/global-mercator/0/0/0.png'));
        o(res.status).equals(200);
        o(rasterMock.calls.length).equals(0);
    });

    o('should 304 if a tile is not modified', async () => {
        const key = 'J6AksQQEhXqW/wywDDsAGtd0OVVqOlKs6M8ViZlOU1g=';
        const request = req('/v1/tiles/aerial/global-mercator/0/0/0.png', 'get', {
            'if-none-match': key,
        });
        const res = await handleRequest(request);
        o(res.status).equals(304);
        o(res.header('eTaG')).equals(undefined);

        o(tileMock.calls.length).equals(1);
        o(rasterMock.calls.length).equals(0);

        o(request.logContext['cache']).deepEquals({ key, match: key, hit: true });
    });

    o.spec('WMTSCapabilities', () => {
        const origPublicUrlBase = process.env[Env.PublicUrlBase];
        o.after(() => {
            process.env[Env.PublicUrlBase] = origPublicUrlBase;
        });

        o('should 304 if a xml is not modified', async () => {
            const key = 'y9mUSt9dBu+bfVfBUQWpUzogbxkshoeDUSi/Gkn2zpA=';
            const request = req('/v1/tiles/aerial/WMTSCapabilities.xml', 'get', {
                'if-none-match': key,
            });

            const res = await handleRequest(request);
            if (res.status == 200) o(res.header('eTaG')).equals(key); // this line is useful for discovering the new etag
            o(res.status).equals(304);
            o(rasterMock.calls.length).equals(0);

            o(request.logContext['cache']).deepEquals({ key, match: key, hit: true });
        });

        o('should serve WMTSCapabilities for tile_set', async () => {
            process.env[Env.PublicUrlBase] = 'https://tiles.test';

            const request = req('/v1/tiles/aerial/WMTSCapabilities.xml');
            request.apiKey = 'secretKey';

            const res = await handleRequest(request);
            o(res.status).equals(200);
            o(res.header('content-type')).equals('text/xml');
            o(res.header('cache-control')).equals('max-age=0');
            o(res.header('eTaG')).equals('DvrjCQ7yeedJe1HuhvSTGw8EdEcOmytydeqsY9rzz8E=');

            const body = Buffer.from(res.getBody() ?? '', 'base64').toString();
            o(body.slice(0, 100)).equals(
                '<?xml version="1.0"?>\n' +
                    '<Capabilities xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.op',
            );

            const vdom = await VNodeParser.parse(body);
            const url = vdom.tags('ResourceURL').next().value!;
            o(url.toString()).equals(
                '<ResourceURL format="image/png" resourceType="tile" ' +
                    'template="https://tiles.test/v1/tiles/aerial/3857/{TileMatrix}/{TileCol}/{TileRow}.png?api=secretKey" />',
            );
        });
    });

    ['/favicon.ico', '/index.html', '/foo/bar'].forEach((path) => {
        o('should error on invalid paths: ' + path, async () => {
            const res = await handleRequest(req(path));
            o(res.status).equals(404);
        });
    });
});
