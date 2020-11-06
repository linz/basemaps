import * as fs from 'fs';
import o from 'ospec';
import sinon from 'sinon';
import * as Tile from '../tile';
import { getExpectedTileName, Health, TestTiles } from '../health';
import { LambdaContext, LambdaHttpResponse } from '@basemaps/lambda';
import { LogConfig } from '@basemaps/shared';

const ctx: LambdaContext = new LambdaContext(
    {
        requestContext: null as any,
        httpMethod: 'get',
        path: '/v1/tiles/health',
        body: null,
        isBase64Encoded: false,
    },
    LogConfig.get(),
);

o.spec('health', () => {
    o.afterEach(() => {
        sinon.restore();
    });

    o('Should return bad response', async () => {
        // Given ... a bad get tile response
        const BadResponse = new LambdaHttpResponse(404, 'Can not get Tile Set.');
        sinon.stub(Tile, 'tile').resolves(BadResponse);

        // When ...
        const res = await Health(ctx);

        // Then ...
        o(res.status).equals(404);
        o(res.statusDescription).equals('Can not get Tile Set.');
    });

    // Prepare mock test tile response based on the static test tiles
    const Response1 = new LambdaHttpResponse(200, 'ok');
    const testTileName1 = getExpectedTileName(TestTiles[0].projection, TestTiles[0].testTile, TestTiles[0].format);
    const testTileFile1 = fs.readFileSync(testTileName1);
    Response1.buffer(testTileFile1);

    const Response2 = new LambdaHttpResponse(200, 'ok');
    const testTileName2 = getExpectedTileName(TestTiles[1].projection, TestTiles[1].testTile, TestTiles[1].format);
    const testTileFile2 = fs.readFileSync(testTileName2);
    Response2.buffer(testTileFile2);

    o('Should good response', async () => {
        // Given ... a series good get tile response
        const callback = sinon.stub(Tile, 'tile');
        callback.onCall(0).resolves(Response1);
        callback.onCall(1).resolves(Response2);

        // When ...
        const res = await Health(ctx);

        // Then ...
        o(res.status).equals(200);
        o(res.statusDescription).equals('ok');
    });

    o('Should return mis-match tile response', async () => {
        // Given ... a bad get tile response for second get tile
        const callback = sinon.stub(Tile, 'tile');
        callback.onCall(0).resolves(Response1);
        callback.onCall(1).resolves(Response1);

        // When ...
        const res = await Health(ctx);

        // Then ...
        o(res.status).equals(404);
        o(res.statusDescription).equals('Test TileSet not match.');
    });
});
