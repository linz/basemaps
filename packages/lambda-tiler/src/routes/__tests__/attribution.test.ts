import { Attribution } from '@basemaps/attribution';
import { ConfigProviderMemory } from '@basemaps/config';
import { GoogleTms, Nztm2000QuadTms, Projection } from '@basemaps/geo';
import { LogConfig } from '@basemaps/shared';
import { BBox } from '@linzjs/geojson';
import { HttpHeader } from '@linzjs/lambda';
import o from 'ospec';
import sinon from 'sinon';

import { FakeData, Imagery2193, Imagery3857, Provider, TileSetAerial } from '../../__tests__/config.data.js';
import { mockUrlRequest } from '../../__tests__/xyz.util.js';
import { handler } from '../../index.js';
import { ConfigLoader } from '../../util/config.loader.js';
import { createCoordinates } from '../attribution.js';

// const ExpectedJson = {
//   id: 'aerial_WebMercatorQuad',
//   type: 'FeatureCollection',
//   stac_version: '1.0.0-beta.2',
//   stac_extensions: ['single-file-stac'],
//   title: 'aerial:title',
//   description: 'aerial:description',
//   features: [
//     {
//       type: 'Feature',
//       stac_version: '1.0.0-beta.2',
//       id: 'im_imageId1_item',
//       collection: 'im_imageId1',
//       assets: {},
//       links: [],
//       bbox: [-22.5, 48.9225, -11.25, 55.7766],
//       geometry: {
//         type: 'MultiPolygon',
//         coordinates: [
//           [
//             [
//               [-22.5, 48.9225],
//               [-19.6875, 48.9225],
//               [-19.6875, 49.838],
//               [-22.5, 49.838],
//               [-22.5, 48.9225],
//             ],
//           ],
//         ],
//       },
//       properties: {
//         title: 'Hastings-district urban 2011-13 0.1m',
//         datetime: null,
//         start_datetime: '2011-01-01T00:00:00Z',
//         end_datetime: '2014-01-01T00:00:00Z',
//       },
//     },
//     {
//       type: 'Feature',
//       stac_version: '1.0.0-beta.2',
//       id: 'im_imageId2_item',
//       collection: 'im_imageId2',
//       assets: {},
//       links: [],
//       bbox: [-11.25, 48.9225, 0, 55.7766],
//       geometry: {
//         type: 'MultiPolygon',
//         coordinates: [
//           [
//             [
//               [-11.25, 48.9225],
//               [-8.4375, 48.9225],
//               [-8.4375, 49.838],
//               [-11.25, 49.838],
//               [-11.25, 48.9225],
//             ],
//           ],
//         ],
//       },
//       properties: {
//         title: 'Hastings-district urban 2013-14 0.1m',
//         datetime: null,
//         start_datetime: '2013-01-01T00:00:00Z',
//         end_datetime: '2015-01-01T00:00:00Z',
//       },
//     },
//     {
//       type: 'Feature',
//       stac_version: '1.0.0-beta.2',
//       id: 'im_imageId3_item',
//       collection: 'im_imageId3',
//       assets: {},
//       links: [],
//       bbox: [0, 48.9225, 11.25, 55.7766],
//       geometry: {
//         type: 'MultiPolygon',
//         coordinates: [
//           [
//             [
//               [0, 48.9225],
//               [2.8125, 48.9225],
//               [2.8125, 49.838],
//               [0, 49.838],
//               [0, 48.9225],
//             ],
//           ],
//         ],
//       },
//       properties: {
//         title: 'Hastings-district urban 2015-17 0.1m',
//         datetime: null,
//         start_datetime: '2015-01-01T00:00:00Z',
//         end_datetime: '2018-01-01T00:00:00Z',
//       },
//     },
//     {
//       type: 'Feature',
//       stac_version: '1.0.0-beta.2',
//       id: 'im_imageId4_item',
//       collection: 'im_imageId4',
//       assets: {},
//       links: [],
//       bbox: [-22.5, 48.9225, -11.25, 55.7766],
//       geometry: {
//         type: 'MultiPolygon',
//         coordinates: [
//           [
//             [
//               [-22.5, 48.9225],
//               [-19.6875, 48.9225],
//               [-19.6875, 49.838],
//               [-22.5, 49.838],
//               [-22.5, 48.9225],
//             ],
//           ],
//         ],
//       },
//       properties: {
//         title: 'Hastings-district urban 2017-18 0.1m',
//         datetime: null,
//         start_datetime: '2017-01-01T00:00:00Z',
//         end_datetime: '2019-01-01T00:00:00Z',
//       },
//     },
//   ],
//   collections: [
//     {
//       stac_version: '1.0.0-beta.2',
//       license: 'CC BY 4.0',
//       id: 'im_imageId1',
//       providers: [
//         {
//           name: 'the name',
//           url: 'https://example.provider.com',
//           roles: ['host'],
//         },
//       ],
//       title: 'Hastings-district urban 2011-13 0.1m',
//       description: 'No description',
//       extent: {
//         spatial: {
//           bbox: [[-22.5, 48.9225, -11.25, 55.7766]],
//         },
//         temporal: {
//           interval: [['2011-01-01T00:00:00Z', '2014-01-01T00:00:00Z']],
//         },
//       },
//       links: [],
//       summaries: {
//         'linz:zoom': {
//           min: 14,
//           max: 16,
//         },
//         'linz:priority': [1000],
//       },
//     },
//     {
//       stac_version: '1.0.0-beta.2',
//       license: 'CC BY 4.0',
//       id: 'im_imageId2',
//       providers: [
//         {
//           name: 'the name',
//           url: 'https://example.provider.com',
//           roles: ['host'],
//         },
//       ],
//       title: 'Hastings-district urban 2013-14 0.1m',
//       description: 'No description',
//       extent: {
//         spatial: {
//           bbox: [[-11.25, 48.9225, 0, 55.7766]],
//         },
//         temporal: {
//           interval: [['2013-01-01T00:00:00Z', '2015-01-01T00:00:00Z']],
//         },
//       },
//       links: [],
//       summaries: {
//         'linz:zoom': {
//           min: 15,
//           max: 17,
//         },
//         'linz:priority': [1001],
//       },
//     },
//     {
//       stac_version: '1.0.0-beta.2',
//       license: 'CC BY 4.0',
//       id: 'im_imageId3',
//       providers: [
//         {
//           name: 'the name',
//           url: 'https://example.provider.com',
//           roles: ['host'],
//         },
//       ],
//       title: 'Hastings-district urban 2015-17 0.1m',
//       description: 'No description',
//       extent: {
//         spatial: {
//           bbox: [[0, 48.9225, 11.25, 55.7766]],
//         },
//         temporal: {
//           interval: [['2015-01-01T00:00:00Z', '2018-01-01T00:00:00Z']],
//         },
//       },
//       links: [],
//       summaries: {
//         'linz:zoom': {
//           min: 16,
//           max: 18,
//         },
//         'linz:priority': [1002],
//       },
//     },
//     {
//       stac_version: '1.0.0-beta.2',
//       license: 'CC BY 4.0',
//       id: 'im_imageId4',
//       providers: [
//         {
//           name: 'the name',
//           url: 'https://example.provider.com',
//           roles: ['host'],
//         },
//       ],
//       title: 'Hastings-district urban 2017-18 0.1m',
//       description: 'No description',
//       extent: {
//         spatial: {
//           bbox: [[-22.5, 48.9225, -11.25, 55.7766]],
//         },
//         temporal: {
//           interval: [['2017-01-01T00:00:00Z', '2019-01-01T00:00:00Z']],
//         },
//       },
//       links: [],
//       summaries: {
//         'linz:zoom': {
//           min: 14,
//           max: 16,
//         },
//         'linz:priority': [1003],
//       },
//     },
//   ],
//   links: [],
// };
// function makeImageRecord(id: string, name: string, x = 10): ConfigImagery {
//   return {
//     id,
//     name,
//     projection: EpsgCode.Google,
//     tileMatrix: 'WebMercatorQuad',
//     uri: 's3://bucket/path/' + name,
//     bounds: GoogleTms.tileToSourceBounds({ x, y: 10, z: 5 }),
//     files: [0, 1].map((i) => {
//       const b = GoogleTms.tileToSourceBounds({ x, y: 10, z: 5 }).toJson() as NamedBounds;
//       b.name = name + i;
//       b.width /= 8;
//       b.height /= 8;
//       b.x += i * b.width;
//       return b;
//     }),
//     updatedAt: Date.now(),
//   };
// }
o.spec('/v1/attribution', () => {
  const config = new ConfigProviderMemory();
  const sandbox = sinon.createSandbox();

  o.beforeEach(() => {
    LogConfig.get().level = 'silent';
    sandbox.stub(ConfigLoader, 'getDefaultConfig').resolves(config);

    config.objects.clear();

    config.put(TileSetAerial);
    config.put(Imagery2193);
    config.put(Imagery3857);
    config.put(Provider);
  });

  o.afterEach(() => {
    sandbox.restore();
  });

  o('should notFound', async () => {
    const request = mockUrlRequest(`/v1/attribution/aerial/1234/summary.json`);
    const res = await handler.router.handle(request);

    o(res.status).equals(404);
  });

  o('should 304 with etag match', async () => {
    const request = mockUrlRequest(`/v1/attribution/aerial/EPSG:3857/summary.json`, 'get', {
      [HttpHeader.IfNoneMatch]: 'E5HGpTqF8AiJ7VgGVKLehYnVfLN9jaVw8Sy6UafJRh2f',
    });

    const res = await handler.router.handle(request);

    if (res.status === 200) o(res.header('etag')).equals('E5HGpTqF8AiJ7VgGVKLehYnVfLN9jaVw8Sy6UafJRh2f');

    console.log(res.header('etag'));
    o(res.status).equals(304);
  });

  o('should parse attribution', async () => {
    const request = mockUrlRequest(`/v1/attribution/aerial/EPSG:3857/summary.json`);
    const res = await handler.router.handle(request);
    o(res.status).equals(200);

    const json = JSON.parse(res.body);

    const attr = Attribution.fromStac(json);
    o(attr.attributions.length).equals(1);
    o(attr.attributions[0].minZoom).equals(0);
    o(attr.attributions[0].maxZoom).equals(32);
  });

  o.spec('ImageryRules', () => {
    const fakeLayer = { [2193]: Imagery2193.id, name: 'image', minZoom: 9, maxZoom: 16, title: 'Image' };
    const ts = FakeData.tileSetRaster('fake');

    o.beforeEach(() => {
      ts.layers = [fakeLayer];
      config.put(Imagery2193);
      config.put(ts);
    });

    o('should generate for NZTM', async () => {
      const req = mockUrlRequest('/v1/tiles/fake/NZTM2000/attribution.json', '');
      const res = await handler.router.handle(req);
      o(res.status).equals(200);

      const output = JSON.parse(res.body);
      o(output.title).equals(ts.title);
      o(output.collections[0].summaries['linz:zoom']).deepEquals({ min: 5, max: 11 });
    });

    o('should generate with correct zooms for NZTM2000Quad', async () => {
      const req = mockUrlRequest('/v1/tiles/fake/NZTM2000Quad/attribution.json', '');
      const res = await handler.router.handle(req);
      o(res.status).equals(200);

      const output = JSON.parse(res.body);
      o(output.title).equals(ts.title);
      o(output.collections[0].summaries['linz:zoom']).deepEquals({ min: 7, max: 14 });
    });

    o('should generate with correct zooms for gebco NZTM2000Quad', async () => {
      const fakeGebco = { ...fakeLayer, minZoom: 0, maxZoom: 15 };
      ts.layers = [fakeGebco];

      const req = mockUrlRequest('/v1/tiles/fake/NZTM2000Quad/attribution.json', '');
      const res = await handler.router.handle(req);
      o(res.status).equals(200);

      const output = JSON.parse(res.body);
      o(output.title).equals(ts.title);
      o(output.collections[0].summaries['linz:zoom']).deepEquals({ min: 0, max: 13 });
    });

    o('should generate with correct zooms for nz sentinel NZTM2000Quad', async () => {
      const fakeGebco = { ...fakeLayer, minZoom: 0, maxZoom: 32 };
      ts.layers = [fakeGebco];

      const req = mockUrlRequest('/v1/tiles/fake/NZTM2000Quad/attribution.json', '');
      const res = await handler.router.handle(req);
      o(res.status).equals(200);

      const output = JSON.parse(res.body);
      o(output.title).equals(ts.title);
      o(output.collections[0].summaries['linz:zoom']).deepEquals({ min: 0, max: Nztm2000QuadTms.maxZoom });
    });
  });

  o('should create valid coordinates', async () => {
    //bbox: BBox, files: NamedBounds[], proj: Projection
    const bbox = [174.79248047, -38.21228805, 175.25939941, -37.99616268] as BBox;
    const proj = Projection.get(GoogleTms);
    const coordinates = createCoordinates(bbox, Imagery3857.files, proj);
    console.log(JSON.stringify(coordinates));
    o(coordinates).deepEquals([
      [
        [
          [174.79247149, -38.09998972],
          [174.81446211, -38.09998972],
          [174.81446211, -38.09134368],
          [174.82544844, -38.09134368],
          [174.82544844, -38.08485848],
          [174.82819502, -38.08485848],
          [174.82819502, -38.08269662],
          [174.83643476, -38.08269662],
          [174.83643476, -38.06539942],
          [174.85840742, -38.06539942],
          [174.85840742, -37.9961556],
          [174.81446211, -37.9961556],
          [174.81446211, -37.9961556],
          [174.79247149, -37.9961556],
          [174.79247149, -38.01348331],
          [174.80345781, -38.01348331],
          [174.80345781, -38.02213855],
          [174.81444414, -38.02213855],
          [174.81444414, -38.04808399],
          [174.79247149, -38.04808399],
          [174.79247149, -38.09998972],
        ],
      ],
      [
        [
          [175.16600664, -38.20366238],
          [175.1879793, -38.20366238],
          [175.1879793, -38.21229511],
          [175.20996992, -38.21229511],
          [175.20996992, -38.20797887],
          [175.21546308, -38.20797887],
          [175.21546308, -38.20366238],
          [175.25391523, -38.20366238],
          [175.25391523, -38.18207606],
          [175.2594084, -38.18207606],
          [175.2594084, -38.17342562],
          [175.25391523, -38.17342562],
          [175.25391523, -38.13454951],
          [175.20995195, -38.13454951],
          [175.20995195, -38.16046922],
          [175.19896563, -38.16046922],
          [175.19896563, -38.16694771],
          [175.19621904, -38.16694771],
          [175.19621904, -38.16910707],
          [175.16600664, -38.16910707],
          [175.16600664, -38.20366238],
        ],
      ],
    ]);
  });
});
