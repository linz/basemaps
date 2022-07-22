// import { ConfigProvider, ConfigProviderMemory } from '@basemaps/config';
// import { GoogleTms, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
// import { Config, Env, LogConfig } from '@basemaps/shared';
// import { round } from '@basemaps/test/build/rounding.js';
// import o from 'ospec';
// import sinon from 'sinon';
// import { handler } from '../index.js';
// import { Etag } from '../util/etag.js';
// import { TileSets } from '../tile.set.cache.js';
// import { TileComposer } from '../tile.set.raster.js';
// import { Provider } from './config.data.js';
// import { Api, FakeTileSet, FakeTileSetVector, mockRequest } from './xyz.util.js';

// const sandbox = sinon.createSandbox();

// const TileSetNames = ['aerial', 'aerial@head', 'aerial@beta', '01E7PJFR9AMQFJ05X9G7FQ3XMW'];
// /* eslint-disable @typescript-eslint/explicit-function-return-type */
// o.spec('LambdaXyz', () => {
//   const host = 'https://tiles.test';
//   const origPublicUrlBase = process.env[Env.PublicUrlBase];

//   let rasterMock = o.spy();
//   const generateMock = o.spy(() => 'foo');
//   const rasterMockBuffer = Buffer.from([1]);
//   const origTileEtag = Etag.generate;
//   const origCompose = TileComposer.compose;
//   const memory = new ConfigProviderMemory();

//   function createFake(tileSetName: string, tileMatrix: TileMatrixSet): void {
//     const tileSet = new FakeTileSet(tileSetName, tileMatrix);
//     TileSets.add(tileSet);
//     tileSet.getTiffsForTile = (): [] => [];
//     tileSet.initTiffs = async () => [];
//   }

//   o.beforeEach(() => {
//     Config.setConfigProvider(memory);
//     memory.put(Provider);
//     process.env[Env.PublicUrlBase] = host;

//     LogConfig.disable();
//     // tileMock = o.spy(() => tileMockData) as any;
//     rasterMock = o.spy(() => {
//       return {
//         buffer: rasterMockBuffer,
//       };
//     }) as any;

//     Etag.generate = generateMock;
//     TileComposer.compose = rasterMock as any;

//     for (const tileSetName of TileSetNames) {
//       for (const tileMatrix of TileMatrixSets.All) createFake(tileSetName, tileMatrix);
//     }

//     TileSets.add(new FakeTileSetVector('topographic', GoogleTms));
//   });

//   o.afterEach(() => {
//     TileSets.cache.clear();
//     TileComposer.compose = origCompose;
//     Etag.generate = origTileEtag;
//     process.env[Env.PublicUrlBase] = origPublicUrlBase;
//     sandbox.restore();
//   });

//   o('should export handler', async () => {
//     const base = await import('../index.js');
//     o(typeof base.handler).equals('function');
//   });

//   TileSetNames.forEach((tileSetName) => {
//     o(`should generate a tile 0,0,0 for ${tileSetName}.png`, async () => {
//       const request = mockRequest(`/v1/tiles/${tileSetName}/global-mercator/0/0/0.png`, 'get', Api.header);
//       const res = await handler.router.handle(request);
//       o(res.status).equals(200);
//       o(res.header('content-type')).equals('image/png');
//       o(res.header('eTaG')).equals('foo');
//       o(res.body).equals(rasterMockBuffer.toString('base64'));

//       // Validate the session information has been set correctly
//       o(request.logContext['tileSet']).equals(tileSetName);
//       o(request.logContext['xyz']).deepEquals({ x: 0, y: 0, z: 0 });
//       o(round(request.logContext['location'])).deepEquals({ lat: 0, lon: 0 });
//     });
//   });

//   o('should generate a tile 0,0,0 for webp', async () => {
//     const request = mockRequest('/v1/tiles/aerial/3857/0/0/0.webp', 'get', Api.header);
//     const res = await handler.router.handle(request);
//     o(res.status).equals(200);
//     o(res.header('content-type')).equals('image/webp');
//     o(res.header('eTaG')).equals('foo');
//     o(res.body).equals(rasterMockBuffer.toString('base64'));

//     // Validate the session information has been set correctly
//     o(request.logContext['xyz']).deepEquals({ x: 0, y: 0, z: 0 });
//     o(round(request.logContext['location'])).deepEquals({ lat: 0, lon: 0 });
//   });

//   ['png', 'webp', 'jpeg', 'avif'].forEach((fmt) => {
//     o(`should 200 with empty ${fmt} if a tile is out of bounds`, async () => {
//       // tiler.tile = async () => [];
//       const res = await handler.router.handle(
//         mockRequest(`/v1/tiles/aerial/global-mercator/0/0/0.${fmt}`, 'get', Api.header),
//       );
//       o(res.status).equals(200);
//       o(res.header('content-type')).equals(`image/${fmt}`);
//       o(rasterMock.calls.length).equals(1);
//     });
//   });

//   o('should 304 if a tile is not modified', async () => {
//     const key = 'foo';
//     const request = mockRequest('/v1/tiles/aerial/global-mercator/0/0/0.png', 'get', {
//       'if-none-match': key,
//       ...Api.header,
//     });
//     const res = await handler.router.handle(request);
//     o(res.status).equals(304);
//     o(res.header('eTaG')).equals(undefined);

//     o(rasterMock.calls.length).equals(0);
//     o(request.logContext['cache']).deepEquals({ key, match: key, hit: true });
//   });

//   o('should 404 if a tile is outside of the range', async () => {
//     const res = await handler.router.handle(
//       mockRequest('/v1/tiles/aerial/global-mercator/25/0/0.png', 'get', Api.header),
//     );
//     o(res.status).equals(404);

//     const resB = await handler.router.handle(mockRequest('/v1/tiles/aerial/2193/17/0/0.png', 'get', Api.header));
//     o(resB.status).equals(404);
//   });

//   o('should support utf8 tilesets', async () => {
//     createFake('🦄 🌈', GoogleTms);
//     const req = mockRequest('/v1/tiles/🦄 🌈/global-mercator/0/0/0.png', 'get', Api.header);
//     o(req.path).equals('/v1/tiles/%F0%9F%A6%84%20%F0%9F%8C%88/global-mercator/0/0/0.png');
//     const res = await handler.router.handle(req);
//     o(res.status).equals(200);
//     o(res.header('content-type')).equals('image/png');
//   });

//   ['/favicon.ico', '/index.html', '/foo/bar'].forEach((path) => {
//     o('should error on invalid paths: ' + path, async () => {
//       const res = await handler.router.handle(mockRequest(path, 'get', Api.header));
//       o(res.status).equals(404);
//     });
//   });
// });
