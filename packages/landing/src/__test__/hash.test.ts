// import { GoogleTms, Nztm2000QuadTms, Nztm2000Tms } from '@basemaps/geo';
// import o from 'ospec';
// import { Config } from '../config.js';
// import { MapOptionType, WindowUrl } from '../url.js';

// declare const global: {
//   window?: { location: { origin: string } };
// };

// o.spec('WindowUrl', () => {
//   o.beforeEach(() => {
//     global.window = { location: { origin: 'https://basemaps.linz.govt.nz' } };
//   });
//   o.afterEach(() => {
//     delete global.window;
//   });
//   const googleLoc = { lat: 174.7763921, lon: -41.277848, zoom: 8 };

//   o.spec('Hash', () => {
//     o('should encode lon lat', () => {
//       const output = WindowUrl.toHash(googleLoc);
//       o(output).equals('#@174.7763921,-41.2778480,z8');
//       o(WindowUrl.fromHash(output)).deepEquals(googleLoc);
//       o(WindowUrl.fromHash('#@174.7763921,-41.2778480,8z')).deepEquals(googleLoc);
//     });

//     o('should encode fractional zooms', () => {
//       o(WindowUrl.fromHash('#@174.7763921,-41.2778480,14.25z').zoom).deepEquals(14.25);
//       o(WindowUrl.fromHash('#@174.7763921,-41.2778480,z14.25').zoom).deepEquals(14.25);
//     });

//     o('should not fail if parts are missing', () => {
//       const missingZoom = WindowUrl.fromHash('#@174.7763921,-41.2778480,');
//       o(missingZoom).deepEquals({ lat: googleLoc.lat, lon: googleLoc.lon });
//       const missingParam = WindowUrl.fromHash('#@174.7763921,');
//       o(missingParam).deepEquals({});
//     });
//   });

//   o('should extract information', () => {
//     o(WindowUrl.fromUrl('')).deepEquals({
//       tileMatrix: GoogleTms,
//       layerId: 'aerial',
//       style: 'topolike',
//       debug: false,
//     });
//     o(WindowUrl.fromUrl('?p=2193')).deepEquals({
//       tileMatrix: Nztm2000QuadTms,
//       layerId: 'aerial',
//       style: 'topolike',
//       debug: false,
//     });
//     o(WindowUrl.fromUrl('?i=abc123')).deepEquals({
//       tileMatrix: GoogleTms,
//       layerId: 'abc123',
//       style: 'topolike',
//       debug: false,
//     });

//     o(WindowUrl.fromUrl('?i=abc123&p=2193')).deepEquals({
//       tileMatrix: Nztm2000QuadTms,
//       layerId: 'abc123',
//       style: null,
//       debug: false,
//     });
//     o(WindowUrl.fromUrl('?i=abc123&p=2193&d=true')).deepEquals({
//       tileMatrix: Nztm2000QuadTms,
//       layerId: 'abc123',
//       style: null,
//       debug: false,
//     });
//     o(WindowUrl.fromUrl('?i=abc123&s=basic&p=2193&d=true&debug=yes')).deepEquals({
//       tileMatrix: Nztm2000QuadTms,
//       layerId: 'abc123',
//       style: 'basic',
//       debug: true,
//     });
//   });

//   o('should extract tile matrix information', () => {
//     o(WindowUrl.fromUrl('?i=abc123&p=nztm2000&d=true&debug=yes')).deepEquals({
//       tileMatrix: Nztm2000QuadTms,
//       layerId: 'abc123',
//       style: null,
//       debug: true,
//     });
//     o(WindowUrl.fromUrl('?i=abc123&p=nztm2000quad&d=true&debug=yes')).deepEquals({
//       tileMatrix: Nztm2000QuadTms,
//       layerId: 'abc123',
//       style: null,
//       debug: true,
//     });

//     o(WindowUrl.fromUrl('?i=abc123&s=basic&p=NZTM2000Quad&d=true&debug=yes')).deepEquals({
//       tileMatrix: Nztm2000QuadTms,
//       layerId: 'abc123',
//       style: null,
//       debug: true,
//     });
//   });

//   o('should convert to a url', () => {
//     const apiKey = Config.ApiKey;
//     const options = WindowUrl.fromUrl('');
//     o(WindowUrl.toTileUrl(options, MapOptionType.TileRaster)).equals(
//       `https://basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:3857/{z}/{x}/{y}.png?api=${apiKey}`,
//     );
//     o(WindowUrl.toTileUrl(options, MapOptionType.Wmts)).equals(
//       `https://basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:3857/WMTSCapabilities.xml?api=${apiKey}`,
//     );
//     o(WindowUrl.toTileUrl(options, MapOptionType.TileWmts)).equals(
//       `https://basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:3857/{TileMatrix}/{TileCol}/{TileRow}.png?api=${apiKey}`,
//     );
//   });

//   o('should use default epsg codes for urls', () => {
//     const apiKey = Config.ApiKey;
//     const options = WindowUrl.fromUrl('');
//     o(WindowUrl.toTileUrl(options, MapOptionType.TileRaster)).equals(
//       `https://basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:3857/{z}/{x}/{y}.png?api=${apiKey}`,
//     );
//     options.tileMatrix = Nztm2000Tms;
//     o(WindowUrl.toTileUrl(options, MapOptionType.TileRaster)).equals(
//       `https://basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:2193/{z}/{x}/{y}.png?api=${apiKey}`,
//     );
//     options.tileMatrix = Nztm2000QuadTms;
//     o(WindowUrl.toTileUrl(options, MapOptionType.TileRaster)).equals(
//       `https://basemaps.linz.govt.nz/v1/tiles/aerial/NZTM2000Quad/{z}/{x}/{y}.png?api=${apiKey}`,
//     );
//   });

//   o('should convert to a url with baseUrl', () => {
//     const options = WindowUrl.fromUrl('');
//     const apiKey = Config.ApiKey;

//     process.env.TILE_HOST = 'https://foo.bar.com';
//     o(WindowUrl.toTileUrl(options, MapOptionType.TileRaster)).equals(
//       `https://foo.bar.com/v1/tiles/aerial/EPSG:3857/{z}/{x}/{y}.png?api=${apiKey}`,
//     );
//     o(WindowUrl.toTileUrl(options, MapOptionType.Wmts)).equals(
//       `https://foo.bar.com/v1/tiles/aerial/EPSG:3857/WMTSCapabilities.xml?api=${apiKey}`,
//     );
//     o(WindowUrl.toTileUrl(options, MapOptionType.TileWmts)).equals(
//       `https://foo.bar.com/v1/tiles/aerial/EPSG:3857/{TileMatrix}/{TileCol}/{TileRow}.png?api=${apiKey}`,
//     );

//     WindowUrl.ImageFormat = 'webp';
//     o(WindowUrl.toTileUrl(options, MapOptionType.TileWmts)).equals(
//       `https://foo.bar.com/v1/tiles/aerial/EPSG:3857/{TileMatrix}/{TileCol}/{TileRow}.webp?api=${apiKey}`,
//     );
//     delete process.env.TILE_HOST;
//   });

//   o('should remove im_ prefix from imagery', () => {
//     const options = WindowUrl.fromUrl('i=im_01EDA2YFXH2JN264VG1HKBT625');
//     o(options.layerId).equals('01EDA2YFXH2JN264VG1HKBT625');

//     const optionsB = WindowUrl.fromUrl('i=01EDA2YFXH2JN264VG1HKBT625');
//     o(optionsB.layerId).equals('01EDA2YFXH2JN264VG1HKBT625');
//   });
// });
