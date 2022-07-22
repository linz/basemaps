// import { GoogleTms, ImageFormat, Nztm2000Tms } from '@basemaps/geo';
// import { TestTiff } from '@basemaps/test';
// import { Composition } from '@basemaps/tiler';
// import o from 'ospec';
// import { Etag } from '../util/etag.js';
// import { TileXyz } from '../util/validate.js';

// o.spec('TileCacheKey', () => {
//   const oldRenderId = Etag.RenderId;

//   const xyzData: TileXyz = {
//     tile: { x: 0, y: 0, z: 0 },
//     tileMatrix: GoogleTms,
//     tileSet: 'foo',
//     tileType: ImageFormat.Png,
//   };

//   o.afterEach(() => {
//     Etag.RenderId = oldRenderId;
//   });

//   o('should generate a cachekey', async () => {
//     const tiff = await TestTiff.Google.init();
//     const comp: Composition = {
//       tiff,
//       source: {
//         x: 0,
//         y: 0,
//         imageId: 0,
//         width: 512,
//         height: 512,
//       },
//       x: 5,
//       y: 5,
//     };
//     const firstKey = Etag.generate([comp], xyzData);
//     o(firstKey).equals('EaJVee45hPyrShwtsMvPfoPqD3mEPqAr2Vgi9WYGp6Bo');

//     // Different layers should generate different keys
//     o(Etag.generate([comp, comp], xyzData)).notEquals(firstKey);

//     // Different projections should generate different keys
//     xyzData.tileMatrix = Nztm2000Tms;
//     o(Etag.generate([comp], xyzData)).notEquals(firstKey);
//   });

//   o('should change if the renderId changes', () => {
//     const keyA = Etag.generate([], { tileMatrix: {} } as any);
//     Etag.RenderId = 2;
//     const KeyB = Etag.generate([], { tileMatrix: {} } as any);
//     o(keyA).notEquals(KeyB);
//   });
// });
