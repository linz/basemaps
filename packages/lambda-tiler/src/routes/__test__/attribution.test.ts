import { ConfigImagery, ConfigLayer, ConfigProvider } from '@basemaps/config';
import { EpsgCode, GoogleTms, NamedBounds, Nztm2000QuadTms, Nztm2000Tms, Stac, TileMatrixSets } from '@basemaps/geo';
import { HttpHeader } from '@linzjs/lambda';
import { Config } from '@basemaps/shared';
import { mockFileOperator } from '@basemaps/shared/build/file/__test__/file.operator.test.helper.js';
import { round } from '@basemaps/test/build/rounding.js';
import o from 'ospec';
import sinon from 'sinon';
const sandbox = sinon.createSandbox();
import { TileSets } from '../../tile.set.cache.js';
import { TileSetRaster } from '../../tile.set.raster.js';
import { FakeTileSet, mockRequest, Provider } from '../../__test__/xyz.util.js';
import { attribution, createAttributionCollection } from '../attribution.js';
import { TileEtag } from '../tile.etag.js';
import { Attribution } from '@basemaps/attribution';

const ExpectedJson = {
  id: 'aerial_WebMercatorQuad',
  type: 'FeatureCollection',
  stac_version: '1.0.0-beta.2',
  stac_extensions: ['single-file-stac'],
  title: 'aerial:title',
  description: 'aerial:description',
  features: [
    {
      type: 'Feature',
      stac_version: '1.0.0-beta.2',
      id: 'im_imageId1_item',
      collection: 'im_imageId1',
      assets: {},
      links: [],
      bbox: [-22.5, 48.9225, -11.25, 55.7766],
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [-22.5, 48.9225],
              [-19.6875, 48.9225],
              [-19.6875, 49.838],
              [-22.5, 49.838],
              [-22.5, 48.9225],
            ],
          ],
        ],
      },
      properties: {
        datetime: null,
        start_datetime: '2011-01-01T00:00:00Z',
        end_datetime: '2014-01-01T00:00:00Z',
      },
    },
    {
      type: 'Feature',
      stac_version: '1.0.0-beta.2',
      id: 'im_imageId2_item',
      collection: 'im_imageId2',
      assets: {},
      links: [],
      bbox: [-11.25, 48.9225, 0, 55.7766],
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [-11.25, 48.9225],
              [-8.4375, 48.9225],
              [-8.4375, 49.838],
              [-11.25, 49.838],
              [-11.25, 48.9225],
            ],
          ],
        ],
      },
      properties: {
        datetime: null,
        start_datetime: '2013-01-01T00:00:00Z',
        end_datetime: '2015-01-01T00:00:00Z',
      },
    },
    {
      type: 'Feature',
      stac_version: '1.0.0-beta.2',
      id: 'im_imageId3_item',
      collection: 'im_imageId3',
      assets: {},
      links: [],
      bbox: [0, 48.9225, 11.25, 55.7766],
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [0, 48.9225],
              [2.8125, 48.9225],
              [2.8125, 49.838],
              [0, 49.838],
              [0, 48.9225],
            ],
          ],
        ],
      },
      properties: {
        datetime: null,
        start_datetime: '2015-01-01T00:00:00Z',
        end_datetime: '2018-01-01T00:00:00Z',
      },
    },
    {
      type: 'Feature',
      stac_version: '1.0.0-beta.2',
      id: 'im_imageId4_item',
      collection: 'im_imageId4',
      assets: {},
      links: [],
      bbox: [-22.5, 48.9225, -11.25, 55.7766],
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [-22.5, 48.9225],
              [-19.6875, 48.9225],
              [-19.6875, 49.838],
              [-22.5, 49.838],
              [-22.5, 48.9225],
            ],
          ],
        ],
      },
      properties: {
        datetime: null,
        start_datetime: '2017-01-01T00:00:00Z',
        end_datetime: '2019-01-01T00:00:00Z',
      },
    },
  ],
  collections: [
    {
      stac_version: '1.0.0-beta.2',
      license: 'CC BY 4.0',
      id: 'im_imageId1',
      providers: [
        {
          name: 'the name',
          url: 'https://example.provider.com',
          roles: ['host'],
        },
      ],
      title: 'Hastings-district urban 2011-13 0.1m',
      description: 'No description',
      extent: {
        spatial: {
          bbox: [[-22.5, 48.9225, -11.25, 55.7766]],
        },
        temporal: {
          interval: [['2011-01-01T00:00:00Z', '2014-01-01T00:00:00Z']],
        },
      },
      links: [],
      summaries: {
        'linz:zoom': {
          min: 14,
          max: 16,
        },
        'linz:priority': [1000],
      },
    },
    {
      stac_version: '1.0.0-beta.2',
      license: 'CC BY 4.0',
      id: 'im_imageId2',
      providers: [
        {
          name: 'the name',
          url: 'https://example.provider.com',
          roles: ['host'],
        },
      ],
      title: 'Hastings-district urban 2013-14 0.1m',
      description: 'No description',
      extent: {
        spatial: {
          bbox: [[-11.25, 48.9225, 0, 55.7766]],
        },
        temporal: {
          interval: [['2013-01-01T00:00:00Z', '2015-01-01T00:00:00Z']],
        },
      },
      links: [],
      summaries: {
        'linz:zoom': {
          min: 15,
          max: 17,
        },
        'linz:priority': [1001],
      },
    },
    {
      stac_version: '1.0.0-beta.2',
      license: 'CC BY 4.0',
      id: 'im_imageId3',
      providers: [
        {
          name: 'the name',
          url: 'https://example.provider.com',
          roles: ['host'],
        },
      ],
      title: 'Hastings-district urban 2015-17 0.1m',
      description: 'No description',
      extent: {
        spatial: {
          bbox: [[0, 48.9225, 11.25, 55.7766]],
        },
        temporal: {
          interval: [['2015-01-01T00:00:00Z', '2018-01-01T00:00:00Z']],
        },
      },
      links: [],
      summaries: {
        'linz:zoom': {
          min: 16,
          max: 18,
        },
        'linz:priority': [1002],
      },
    },
    {
      stac_version: '1.0.0-beta.2',
      license: 'CC BY 4.0',
      id: 'im_imageId4',
      providers: [
        {
          name: 'the name',
          url: 'https://example.provider.com',
          roles: ['host'],
        },
      ],
      title: 'Hastings-district urban 2017-18 0.1m',
      description: 'No description',
      extent: {
        spatial: {
          bbox: [[-22.5, 48.9225, -11.25, 55.7766]],
        },
        temporal: {
          interval: [['2017-01-01T00:00:00Z', '2019-01-01T00:00:00Z']],
        },
      },
      links: [],
      summaries: {
        'linz:zoom': {
          min: 14,
          max: 16,
        },
        'linz:priority': [1003],
      },
    },
  ],
  links: [],
};
function makeImageRecord(id: string, name: string, x = 10): ConfigImagery {
  return {
    id,
    name,
    projection: EpsgCode.Google,
    uri: 's3://bucket/path/' + name,
    bounds: GoogleTms.tileToSourceBounds({ x, y: 10, z: 5 }),
    files: [0, 1].map((i) => {
      const b = GoogleTms.tileToSourceBounds({ x, y: 10, z: 5 }).toJson() as NamedBounds;
      b.name = name + i;
      b.width /= 8;
      b.height /= 8;
      b.x += i * b.width;
      return b;
    }),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
o.spec('attribution', () => {
  o.spec('fetch', () => {
    const origTileEtag = TileEtag.generate;
    const generateMock = o.spy(() => 'foo');
    const TileSetNames = ['aerial', 'aerial@head', 'aerial@beta', '01E7PJFR9AMQFJ05X9G7FQ3XMW'];

    const mockFs = mockFileOperator();

    o.beforeEach(() => {
      mockFs.setup();
      TileEtag.generate = generateMock;
      // Mock the tile generation
      for (const tileSetName of TileSetNames) {
        for (const tileMatrix of TileMatrixSets.Defaults.values()) {
          const tileSet = new FakeTileSet(tileSetName, tileMatrix);
          TileSets.add(tileSet);
          const layers: ConfigLayer[] = [];
          const imagery = new Map<string, ConfigImagery>();
          const addRule = (id: string, name: string, minZoom = 10): void => {
            const imgId = Config.Imagery.id(id);
            imagery.set(imgId, makeImageRecord(imgId, name, minZoom));
            layers.push({
              [3857]: imgId,
              name,
              minZoom,
              maxZoom: minZoom + 2,
            });
          };
          addRule('imageId1', 'hastings-district_urban_2011-13_0.1m', 14);
          addRule('imageId2', 'hastings-district_urban_2013-14_0.1m', 15);
          addRule('imageId3', 'hastings-district_urban_2015-17_0.1m', 16);
          addRule('imageId4', 'hastings-district_urban_2017-18_0.1m', 14);
          tileSet.tileSet.layers = layers;
          tileSet.imagery = imagery;
        }
      }
      sandbox.stub(Config.Provider, 'get').callsFake(() => Promise.resolve(Provider));
    });

    o.afterEach(() => {
      sandbox.restore();
      mockFs.teardown();
      TileSets.cache.clear();
      TileEtag.generate = origTileEtag;
    });

    o('should notFound', async () => {
      const request = mockRequest(`/v1/attribution/aerial/1234/summary.json`);
      const res = await attribution(request);

      o(res.status).equals(404);
    });

    o('should 200 with etag mismatch', async () => {
      mockFs.jsStore['s3://bucket/path/image1/collection.json'] = {
        extent: {
          spatial: { bbox: [1, 2, 3, 4] },
          temporal: { interval: [['2018-02-03T01:02:03Z', '2018-09-13T11:32:43Z']] },
        },
        title: 'image one',
        description: 'image one description',
        license: Stac.License,
        providers: [
          {
            name: 'p1',
          },
        ],
        summaries: {},
      };
      mockFs.jsStore['s3://bucket/path/image2/collection.json'] = {
        extent: {
          spatial: { bbox: [5, 6, 7, 8] },
          temporal: { interval: [['2016-02-03T01:02:03Z', '2018-09-13T11:32:43Z']] },
        },
        summaries: {},
      };

      const request = mockRequest(`/v1/attribution/aerial/EPSG:3857/summary.json`);
      const res = await attribution(request);

      o(res.status).equals(200);
      o(res.header(HttpHeader.ETag)).equals('3edkgmltK4/LUyTCTYU9MeiNSwlfUvJAx/qORSisUzM=');
      o(res.header(HttpHeader.CacheControl)).equals('public, max-age=86400, stale-while-revalidate=604800');

      const body = round(JSON.parse(res.body as string), 4);
      o(body).deepEquals(ExpectedJson);
    });

    o('should 304 with etag match', async () => {
      const request = mockRequest(`/v1/attribution/aerial/EPSG:3857/summary.json`, 'get', {
        [HttpHeader.IfNoneMatch]: '3edkgmltK4/LUyTCTYU9MeiNSwlfUvJAx/qORSisUzM=',
      });
      const res = await attribution(request);

      o(res.status).equals(304);
    });

    o('should parse attribution', async () => {
      const request = mockRequest(`/v1/attribution/aerial/EPSG:3857/summary.json`);
      const res = await attribution(request);

      const json = JSON.parse(res.body as string);

      const attr = Attribution.fromStac(json);
      o(attr.attributions.length).equals(4);
      o(attr.attributions[0].minZoom).equals(14);
      o(attr.attributions[0].maxZoom).equals(16);
    });
  });

  o.spec('ImageryRule', () => {
    const fakeIm = { name: 'someName' } as ConfigImagery;
    const fakeHost = { serviceProvider: {} } as ConfigProvider;
    const fakeLayer = { [2193]: 'id', name: 'image', minZoom: 9, maxZoom: 16 };

    o('should generate for NZTM', () => {
      const ts = new TileSetRaster('Fake', Nztm2000Tms);
      ts.tileSet = { ...ts.tileSet, layers: [fakeLayer] };

      const output = createAttributionCollection(ts, null, fakeIm, fakeLayer, fakeHost, null as any);
      o(output.title).equals('SomeName');
      o(output.summaries['linz:zoom']).deepEquals({ min: 5, max: 11 });
    });

    o('should generate with correct zooms for NZTM2000Quad', () => {
      const ts = new TileSetRaster('Fake', Nztm2000QuadTms);
      ts.tileSet = { ...ts.tileSet, layers: [fakeLayer] };
      const output = createAttributionCollection(ts, null, fakeIm, fakeLayer, fakeHost, null as any);
      o(output.title).equals('SomeName');
      o(output.summaries['linz:zoom']).deepEquals({ min: 7, max: 14 });
    });

    o('should generate with correct zooms for gebco NZTM2000Quad', () => {
      const fakeGebco = { ...fakeLayer, minZoom: 0, maxZoom: 15 };
      const ts = new TileSetRaster('Fake', Nztm2000QuadTms);
      ts.tileSet = { ...ts.tileSet, layers: [fakeLayer] };
      const output = createAttributionCollection(ts, null, fakeIm, fakeGebco, fakeHost, null as any);
      o(output.title).equals('SomeName');
      o(output.summaries['linz:zoom']).deepEquals({ min: 0, max: 13 });
    });

    o('should generate with correct zooms for nz sentinel NZTM2000Quad', () => {
      const fakeGebco = { ...fakeLayer, minZoom: 0, maxZoom: 32 };
      const ts = new TileSetRaster('Fake', Nztm2000QuadTms);
      ts.tileSet = { ...ts.tileSet, layers: [fakeLayer] };
      const output = createAttributionCollection(ts, null, fakeIm, fakeGebco, fakeHost, null as any);
      o(output.title).equals('SomeName');
      o(output.summaries['linz:zoom']).deepEquals({ min: 0, max: Nztm2000QuadTms.maxZoom });
    });
  });
});
