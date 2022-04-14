import { AttributionCollection, AttributionItem, AttributionStac } from '@basemaps/geo';
import o from 'ospec';
import { Attribution } from '../attribution.js';

o.spec('Attribution', () => {
  const collection: AttributionCollection = {
    stac_version: '1.0.0-beta.2',
    license: 'CC BY 4.0',
    id: 'im_01ED849PJ44FA7S612QAXN9P11',
    providers: [
      {
        name: 'Land Information New Zealand',
        url: 'http://www.linz.govt.nz/',
        roles: ['host', 'processor'],
      },
    ],
    title: 'Chatham Islands 0.5m Satellite Imagery (2014-2019)',
    description: 'No description',
    extent: {
      spatial: {
        bbox: [[-176.92382812, -44.44162422, -176.1328125, -43.54854811]],
      },
      temporal: {
        interval: [['2014-01-01T00:00:00Z', '2015-01-01T00:00:00Z']],
      },
    },
    links: [],
    summaries: {
      'linz:zoom': {
        min: 0,
        max: 12,
      },
      'linz:priority': [1001],
    },
  };
  const feature: AttributionItem = {
    type: 'Feature',
    stac_version: '1.0.0-beta.2',
    id: '01ED849PJ44FA7S612QAXN9P11_item',
    collection: 'im_01ED849PJ44FA7S612QAXN9P11',
    assets: {},
    links: [],
    bbox: [-176.92382812, -44.44162422, -176.1328125, -43.54854811],
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [-176.92383711, -43.83453326],
            [-176.89087812, -43.83453326],
            [-176.89087812, -43.84245765],
            [-176.8798918, -43.84245765],
            [-176.8798918, -43.86622448],
            [-176.7919832, -43.86622448],
            [-176.7919832, -43.84245765],
            [-176.78099688, -43.84245765],
            [-176.78099688, -43.83453326],
            [-176.75904219, -43.83453326],
            [-176.75904219, -43.84245765],
            [-176.74803789, -43.84245765],
            [-176.74803789, -43.83453326],
            [-176.66016523, -43.83453326],
            [-176.66016523, -43.99280804],
            [-176.70411055, -43.99280804],
            [-176.70411055, -44.05601815],
            [-176.66016523, -44.05601815],
            [-176.66016523, -44.06390015],
            [-176.67115156, -44.06390015],
            [-176.67115156, -44.07180692],
            [-176.66016523, -44.07180692],
            [-176.66016523, -44.15068761],
            [-176.48436602, -44.15068761],
            [-176.48436602, -44.08759148],
            [-176.30858477, -44.08759148],
            [-176.30858477, -43.77903311],
            [-176.29759844, -43.77903311],
            [-176.29759844, -43.7711003],
            [-176.25367109, -43.7711003],
            [-176.25367109, -43.77903311],
            [-176.23168047, -43.77903311],
            [-176.23168047, -43.7711003],
            [-176.22069414, -43.7711003],
            [-176.22069414, -43.75523154],
            [-176.19872149, -43.75523154],
            [-176.19872149, -43.74729558],
            [-176.18773516, -43.74729558],
            [-176.18773516, -43.73935857],
            [-176.17674883, -43.73935857],
            [-176.17674883, -43.70758701],
            [-176.57225664, -43.70758701],
            [-176.57225664, -43.6758116],
            [-176.66016523, -43.6758116],
            [-176.66016523, -43.70758701],
            [-176.83594648, -43.70758701],
            [-176.83594648, -43.77108733],
            [-176.92383711, -43.77108733],
            [-176.92383711, -43.83453326],
          ],
        ],
        [
          [
            [-176.83594648, -43.58039736],
            [-176.7919832, -43.58039736],
            [-176.7919832, -43.5485416],
            [-176.83594648, -43.5485416],
            [-176.83594648, -43.58039736],
          ],
        ],
        [
          [
            [-176.39649336, -44.29240752],
            [-176.38548906, -44.29240752],
            [-176.38548906, -44.28453028],
            [-176.39649336, -44.28453028],
            [-176.39649336, -44.29240752],
          ],
        ],
        [
          [
            [-176.35254805, -44.30813311],
            [-176.30860273, -44.30813311],
            [-176.30860273, -44.37099338],
            [-176.22069414, -44.37099338],
            [-176.22069414, -44.33957167],
            [-176.19873945, -44.33957167],
            [-176.19873945, -44.35528463],
            [-176.1767668, -44.35528463],
            [-176.1767668, -44.37099338],
            [-176.13280352, -44.37099338],
            [-176.13280352, -44.21370347],
            [-176.30860273, -44.21370347],
            [-176.30860273, -44.26879836],
            [-176.31958906, -44.26879836],
            [-176.31958906, -44.27666484],
            [-176.35254805, -44.27666484],
            [-176.35254805, -44.30813311],
          ],
        ],
        [
          [
            [-176.33057539, -44.37099338],
            [-176.31957109, -44.37099338],
            [-176.31957109, -44.36312669],
            [-176.33057539, -44.36312669],
            [-176.33057539, -44.37099338],
          ],
        ],
        [
          [
            [-176.24268476, -44.44163063],
            [-176.23168047, -44.44163063],
            [-176.23168047, -44.42592801],
            [-176.24268476, -44.42592801],
            [-176.24268476, -44.44163063],
          ],
        ],
      ],
    },
    properties: {
      title: '',
      datetime: null,
      start_datetime: '2014-01-01T00:00:00Z',
      end_datetime: '2015-01-01T00:00:00Z',
    },
  };

  const stac: AttributionStac = {
    id: 'aerial_WebMercatorQuad',
    type: 'FeatureCollection',
    stac_version: '1.0.0-beta.2',
    stac_extensions: ['single-file-stac'],
    title: 'aerial',
    description: '',
    features: [feature],
    collections: [collection],
    links: [],
  };

  // TODO some attribution is outside of lat/lng bounds BM-113
  // o('should assert bounds', () => {
  //     const stacCopy = JSON.parse(JSON.stringify(stac)) as AttributionStac;

  //     const firstPoly = (stacCopy.features[0].geometry as GeoJSON.MultiPolygon).coordinates[0][0][0];

  //     firstPoly[0] = 190;
  //     o(() => Attribution.fromStac(stacCopy)).throws(Error);

  //     firstPoly[0] = 170;
  //     const ab = Attribution.fromStac(stacCopy);
  //     o(ab.attributions[0].boundaries.length).equals(6);

  //     firstPoly[1] = 91;
  //     o(() => Attribution.fromStac(stacCopy)).throws(Error);
  // });

  o('should find correct matches', () => {
    const ab = Attribution.fromStac(stac);

    const r1 = ab.filter([-176.39344945738608, -44.83033160271776, -174.46936765305725, -44.180572883814044], 10);
    o(r1.length).equals(1);

    const r2 = ab.filter([-176.51378610374528, -44.08586625766628, -174.58970429941644, -43.86880564285871], 10);
    o(r2.length).equals(1);

    const r3 = ab.filter([-177.9303385717797, -43.746220943263886, -176.0062567674509, -43.52792030778592], 10);
    o(r3.length).equals(1);
  });

  o('should filter out inside bbox but outside individual polygons', () => {
    const ab = Attribution.fromStac(stac);

    /**
     * This target extent  is slightly south east of the main polygon and inside the bounding box of the main polygon, but not inside the main polygon
     * 'X' main polygon
     * 'Y' target extent
     * '.' empty
     *
     * XXXXX
     * XXXXX
     * XX...
     * XX.Y.
     * XX...
     * .....
     * ....X
     */
    const r2 = ab.filter([-176.39158207569128, -44.149224068909994, -176.34407960782733, -44.12924725546014], 10);
    o(r2.length).equals(0);

    /**
     * This target extent is slightly south east of the main polygon but north of the southern island so outside the bounds of the two polygons
     * X's main polygon, 'Y' target polygon, '.' empty
     *
     * XXXXX
     * XXXXX
     * XX...
     * XX...
     * ...Y.
     * ....X
     */
    const r3 = ab.filter([-176.39158207569128, -44.19922406890999, -176.34407960782733, -44.18924725546014], 10);
    o(r3.length).equals(0);
  });
});
