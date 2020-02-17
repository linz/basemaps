// process.env['COG_BUCKET'] = 'fake-bucket';
import { Env, LambdaSession, LogConfig } from '@basemaps/lambda-shared';
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
            isBase64Encoded: false,
        };
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
        const res = await handleRequest(req('/v1/group/0/0/0.png'), session, LogConfig.get());
        o(res.status).equals(200);
        o(res.headers).deepEquals({
            'content-type': 'image/png',
            // TODO Should we hardcode a base64'd hash here?
            etag: 'RnwuOlJd5MP0v69ddXhE66PUZyoKGfHTzBI1JMq7sMU=',
        });
        o(res.toResponse().body).equals(rasterMockBuffer.toString('base64'));

        o(tileMock.calls.length).equals(1);
        const [tiffs, x, y, z] = tileMock.args;
        o(tiffs).deepEquals([]);
        o(x).equals(0);
        o(y).equals(0);
        o(z).equals(0);

        // Validate the session information has been set correctly
        o(session.logContext['path']).equals('/v1/group/0/0/0.png');
        o(session.logContext['method']).equals('get');
        o(session.logContext['xyz']).deepEquals({ x: 0, y: 0, z: 0 });
        o(session.logContext['location']).deepEquals({ lat: 0, lon: 0 });
    });

    o('should 200 with empty png if a tile is out of bounds', async () => {
        Tilers.tile256.tile = async () => null;
        const res = await handleRequest(req('/v1/group/0/0/0.png'), new LambdaSession(), LogConfig.get());
        o(res.status).equals(200);
        o(rasterMock.calls.length).equals(0);
    });

    o('should 304 if a tile is not modified', async () => {
        const request = req('/v1/group/0/0/0.png');
        const session = new LambdaSession();

        request.headers = { 'if-none-match': '"RnwuOlJd5MP0v69ddXhE66PUZyoKGfHTzBI1JMq7sMU="' };
        const res = await handleRequest(request, session, LogConfig.get());
        o(res.status).equals(304);
        o(tileMock.calls.length).equals(1);
        o(rasterMock.calls.length).equals(0);

        o(session.logContext['cache'].hit).equals(true);
    });

    ['/favicon.ico', '/index.html', '/foo/bar'].forEach(path => {
        o('should error on invalid paths: ' + path, async () => {
            const res = await handleRequest(req(path), new LambdaSession(), LogConfig.get());
            o(res.status).equals(404);
        });
    });

    o('should respond to /version', async () => {
        process.env[Env.Version] = 'version';
        process.env[Env.Hash] = 'hash';
        const res = await handleRequest(req('/version'), new LambdaSession(), LogConfig.get());
        o(res.statusDescription).equals('ok');
        o(res.status).equals(200);
        o(res.toResponse().body).equals(JSON.stringify({ version: 'version', hash: 'hash' }));
        o(res.toResponse().headers).deepEquals({ 'content-type': 'application/json' });
    });

    o('should respond to /health', async () => {
        const res = await handleRequest(req('/health'), new LambdaSession(), LogConfig.get());
        o(res.statusDescription).equals('ok');
        o(res.status).equals(200);
        o(res.toResponse().body).equals(JSON.stringify({ status: 200, message: 'ok' }));
        o(res.toResponse().headers).deepEquals({ 'content-type': 'application/json' });
    });

    o('should respond to /ping', async () => {
        const res = await handleRequest(req('/ping'), new LambdaSession(), LogConfig.get());
        o(res.statusDescription).equals('ok');
        o(res.status).equals(200);
        o(res.toResponse().body).equals(JSON.stringify({ status: 200, message: 'ok' }));
        o(res.toResponse().headers).deepEquals({ 'content-type': 'application/json' });
    });
});
