import { LambdaHttpResponseAlb, LambdaSession, LogConfig } from '@basemaps/lambda-shared';
import { Tiler } from '@basemaps/tiler';
import { TileMakerSharp } from '@basemaps/tiler-sharp';
import { ALBEvent } from 'aws-lambda';
import * as o from 'ospec';
import 'source-map-support/register';
import { handleRequest } from '../index';
import { TiffUtil } from '../tiff';
import { Tilers } from '../tiler';

/* eslint-disable @typescript-eslint/explicit-function-return-type */
o.spec('LambdaXyz', () => {
    /** Generate mock ALBEvent */
    function req(path: string, method = 'get'): ALBEvent {
        return {
            requestContext: null as any,
            httpMethod: method.toUpperCase(),
            path,
            body: null,
            headers: { host: 'basemaps.test' },
            isBase64Encoded: false,
        };
    }

    let tileMock = o.spy();
    let rasterMock = o.spy();
    const rasterMockBuffer = Buffer.from([1]);

    const makeReq = async (
        path: string,
        session: LambdaSession = new LambdaSession(),
    ): Promise<LambdaHttpResponseAlb> => await handleRequest(req(path), session, LogConfig.get());

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

        // tileMock.mockReturnValue(['TileMock']);
        // rasterMock.mockReturnValue({ buffer: rasterMockBuffer });

        TiffUtil.getTiffsForQuadKey = () => [];
    });

    o.afterEach(() => {
        Tilers.tile256 = new Tiler(256);
        Tilers.compose256 = new TileMakerSharp(256);
    });

    o('should generate a tile 0,0,0', async () => {
        const session = new LambdaSession();
        const res = await makeReq('/v1/tiles/aerial/global-mercator/0/0/0.png', session);
        o(res.status).equals(200);
        o(res.headers).deepEquals({
            'content-type': 'image/png',
            // TODO Should we hardcode a base64'd hash here?
            etag: 'Je+AcRSzbjT8XIAe/VK/Sfh9KlDHPAmq3BkBbpnN3/Q=',
        });
        o(res.toResponse().body).equals(rasterMockBuffer.toString('base64'));

        o(tileMock.calls.length).equals(1);
        const [tiffs, x, y, z] = tileMock.args;
        o(tiffs).deepEquals([]);
        o(x).equals(0);
        o(y).equals(0);
        o(z).equals(0);

        // Validate the session information has been set correctly
        o(session.logContext['path']).equals('/v1/tiles/aerial/global-mercator/0/0/0.png');
        o(session.logContext['method']).equals('get');
        o(session.logContext['xyz']).deepEquals({ x: 0, y: 0, z: 0 });
        o(session.logContext['location']).deepEquals({ lat: 0, lon: 0 });
    });

    o('should 200 with empty png if a tile is out of bounds', async () => {
        Tilers.tile256.tile = async () => null;
        const res = await handleRequest(
            req('/v1/tiles/aerial/global-mercator/0/0/0.png'),
            new LambdaSession(),
            LogConfig.get(),
        );
        o(res.status).equals(200);
        o(rasterMock.calls.length).equals(0);
    });

    o('should 304 if a tile is not modified', async () => {
        const request = req('/v1/tiles/aerial/global-mercator/0/0/0.png');
        const session = new LambdaSession();

        request.headers = { 'if-none-match': 'Je+AcRSzbjT8XIAe/VK/Sfh9KlDHPAmq3BkBbpnN3/Q=' };
        const res = await handleRequest(request, session, LogConfig.get());
        o(res.status).equals(304);
        o(tileMock.calls.length).equals(1);
        o(rasterMock.calls.length).equals(0);

        o(session.logContext['cache'].hit).equals(true);
    });

    o('should serve WMTSCapabilities for tile_set', async () => {
        const request = req('/v1/tiles/aerial/WMTSCapabilities.xml');
        const session = new LambdaSession();

        const res = await handleRequest(request, session, LogConfig.get());
        o(res.status).equals(200);
        o(res.headers).deepEquals({
            'content-type': 'text/xml',
            etag: '9XoLDZpV6tWcS5MWKL6J6WvQ2Rl9WVyyP9Lk/1JuMWU=',
        });

        const body = Buffer.from(res.toResponse().body || '', 'base64').toString();
        o(body.slice(0, 100)).equals(
            '<?xml version="1.0"?>\n' +
                '<Capabilities xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.op',
        );
        const resIdx = body.indexOf('ResourceURL');
        o(body.slice(resIdx, body.indexOf('</ResourceURL>', resIdx))).equals(
            'ResourceURL format="image/png" resourceType="tile" ' +
                'template="/tiles/aerial/{TileMatrix}/{TileCol}/{TileRow}.png">',
        );
    });

    ['/favicon.ico', '/index.html', '/foo/bar'].forEach(path => {
        o('should error on invalid paths: ' + path, async () => {
            const res = await handleRequest(req(path), new LambdaSession(), LogConfig.get());
            o(res.status).equals(404);
        });
    });
});
