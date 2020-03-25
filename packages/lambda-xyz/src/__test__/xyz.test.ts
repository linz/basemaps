import { Env, LambdaContext, LogConfig } from '@basemaps/lambda-shared';
import { Tiler } from '@basemaps/tiler';
import { TileMakerSharp } from '@basemaps/tiler-sharp';
import * as o from 'ospec';
import 'source-map-support/register';
import { handleRequest } from '../index';
import { TiffUtil } from '../tiff';
import { Tilers } from '../tiler';

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

        TiffUtil.getTiffsForQuadKey = () => [];
    });

    o.afterEach(() => {
        Tilers.tile256 = new Tiler(256);
        Tilers.compose256 = new TileMakerSharp(256);
    });

    o('should export handler', async () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const base = require('../index');
        o(typeof base.handler).equals('function');
    });

    o('should generate a tile 0,0,0 for png', async () => {
        const request = req('/v1/tiles/aerial/global-mercator/0/0/0.png');
        const res = await handleRequest(request);
        o(res.status).equals(200);
        o(res.header('content-type')).equals('image/png');
        o(res.header('eTaG')).equals('Je+AcRSzbjT8XIAe/VK/Sfh9KlDHPAmq3BkBbpnN3/Q=');
        o(res.getBody()).equals(rasterMockBuffer.toString('base64'));

        o(tileMock.calls.length).equals(1);
        const [tiffs, x, y, z] = tileMock.args;
        o(tiffs).deepEquals([]);
        o(x).equals(0);
        o(y).equals(0);
        o(z).equals(0);

        // Validate the session information has been set correctly
        o(request.logContext['path']).equals('/v1/tiles/aerial/global-mercator/0/0/0.png');
        o(request.logContext['method']).equals('get');
        o(request.logContext['xyz']).deepEquals({ x: 0, y: 0, z: 0 });
        o(request.logContext['location']).deepEquals({ lat: 0, lon: 0 });
    });

    o('should generate a tile 0,0,0 for webp', async () => {
        const request = req('/v1/tiles/aerial/3857/0/0/0.webp');
        const res = await handleRequest(request);
        o(res.status).equals(200);
        o(res.header('content-type')).equals('image/webp');
        o(res.header('eTaG')).equals('kOkbgX07nGYNVt4RO5HxkKxfL2/uM4UJpf1IJl9ySTk=');
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
        const key = 'Je+AcRSzbjT8XIAe/VK/Sfh9KlDHPAmq3BkBbpnN3/Q=';
        const request = req('/v1/tiles/aerial/global-mercator/0/0/0.png', 'get', {
            'if-none-match': key,
        });
        const res = await handleRequest(request);
        o(res.status).equals(304);
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
            const key = 'AUjdJhRzn4qFv9um0D0/k+8IRxdI4jgzO+QUg/aaMxw=';
            const request = req('/v1/tiles/aerial/WMTSCapabilities.xml', 'get', {
                'if-none-match': key,
            });

            const res = await handleRequest(request);
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
            o(res.header('eTaG')).equals('4hPFjntF8bG9stOVb3kMxU0+MXhrdXfiDbsSjoOeu2A=');

            const body = Buffer.from(res.getBody() ?? '', 'base64').toString();
            o(body.slice(0, 100)).equals(
                '<?xml version="1.0"?>\n' +
                    '<Capabilities xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.op',
            );
            const resIdx = body.indexOf('ResourceURL');
            o(body.slice(resIdx, body.indexOf('</ResourceURL>', resIdx))).equals(
                'ResourceURL format="image/png" resourceType="tile" ' +
                    'template="https://tiles.test/v1/tiles/aerial/3857/{TileMatrix}/{TileCol}/{TileRow}.png?api=secretKey">',
            );
        });
    });

    ['/favicon.ico', '/index.html', '/foo/bar'].forEach(path => {
        o('should error on invalid paths: ' + path, async () => {
            const res = await handleRequest(req(path));
            o(res.status).equals(404);
        });
    });
});
