import { TileMatrixSetType } from '@linzjs/tile-matrix-set';

import { TileMatrixSet } from '../tile.matrix.set.js';

/**
 * **Warning** this is not a standard tile matrix it is used for debugging purposes only
 *
 * Created using ./scripts/debug.tile.matrix.ts
 */
const Citm2000Tmst: TileMatrixSetType & { $generated: unknown; $options: unknown } = {
  type: 'TileMatrixSetType',
  title: 'Debug tile matrix for EPSG:3793',
  abstract: '',
  identifier: 'CITM2000Quad',
  supportedCRS: 'https://www.opengis.net/def/crs/EPSG/0/3793',
  boundingBox: {
    type: 'BoundingBoxType',
    crs: 'https://www.opengis.net/def/crs/EPSG/0/3793',
    lowerCorner: [3430154.3757978342, 5051234.111622438],
    upperCorner: [3586697.4097258747, 5207777.145550478],
  },
  tileMatrix: [
    {
      type: 'TileMatrixType',
      identifier: '0',
      scaleDenominator: 2183915.0938621718,
      topLeftCorner: [3586697.4097258747, 5051234.111622438],
      tileWidth: 256,
      tileHeight: 256,
      matrixWidth: 1,
      matrixHeight: 1,
    },
    {
      type: 'TileMatrixType',
      identifier: '1',
      scaleDenominator: 1091957.5469310859,
      topLeftCorner: [3586697.4097258747, 5051234.111622438],
      tileWidth: 256,
      tileHeight: 256,
      matrixWidth: 2,
      matrixHeight: 2,
    },
    {
      type: 'TileMatrixType',
      identifier: '2',
      scaleDenominator: 545978.7734655429,
      topLeftCorner: [3586697.4097258747, 5051234.111622438],
      tileWidth: 256,
      tileHeight: 256,
      matrixWidth: 4,
      matrixHeight: 4,
    },
    {
      type: 'TileMatrixType',
      identifier: '3',
      scaleDenominator: 272989.38673277147,
      topLeftCorner: [3586697.4097258747, 5051234.111622438],
      tileWidth: 256,
      tileHeight: 256,
      matrixWidth: 8,
      matrixHeight: 8,
    },
    {
      type: 'TileMatrixType',
      identifier: '4',
      scaleDenominator: 136494.69336638573,
      topLeftCorner: [3586697.4097258747, 5051234.111622438],
      tileWidth: 256,
      tileHeight: 256,
      matrixWidth: 16,
      matrixHeight: 16,
    },
    {
      type: 'TileMatrixType',
      identifier: '5',
      scaleDenominator: 68247.34668319287,
      topLeftCorner: [3586697.4097258747, 5051234.111622438],
      tileWidth: 256,
      tileHeight: 256,
      matrixWidth: 32,
      matrixHeight: 32,
    },
    {
      type: 'TileMatrixType',
      identifier: '6',
      scaleDenominator: 34123.67334159643,
      topLeftCorner: [3586697.4097258747, 5051234.111622438],
      tileWidth: 256,
      tileHeight: 256,
      matrixWidth: 64,
      matrixHeight: 64,
    },
    {
      type: 'TileMatrixType',
      identifier: '7',
      scaleDenominator: 17061.836670798217,
      topLeftCorner: [3586697.4097258747, 5051234.111622438],
      tileWidth: 256,
      tileHeight: 256,
      matrixWidth: 128,
      matrixHeight: 128,
    },
    {
      type: 'TileMatrixType',
      identifier: '8',
      scaleDenominator: 8530.918335399108,
      topLeftCorner: [3586697.4097258747, 5051234.111622438],
      tileWidth: 256,
      tileHeight: 256,
      matrixWidth: 256,
      matrixHeight: 256,
    },
    {
      type: 'TileMatrixType',
      identifier: '9',
      scaleDenominator: 4265.459167699554,
      topLeftCorner: [3586697.4097258747, 5051234.111622438],
      tileWidth: 256,
      tileHeight: 256,
      matrixWidth: 512,
      matrixHeight: 512,
    },
    {
      type: 'TileMatrixType',
      identifier: '10',
      scaleDenominator: 2132.729583849777,
      topLeftCorner: [3586697.4097258747, 5051234.111622438],
      tileWidth: 256,
      tileHeight: 256,
      matrixWidth: 1024,
      matrixHeight: 1024,
    },
    {
      type: 'TileMatrixType',
      identifier: '11',
      scaleDenominator: 1066.3647919248886,
      topLeftCorner: [3586697.4097258747, 5051234.111622438],
      tileWidth: 256,
      tileHeight: 256,
      matrixWidth: 2048,
      matrixHeight: 2048,
    },
    {
      type: 'TileMatrixType',
      identifier: '12',
      scaleDenominator: 533.1823959624443,
      topLeftCorner: [3586697.4097258747, 5051234.111622438],
      tileWidth: 256,
      tileHeight: 256,
      matrixWidth: 4096,
      matrixHeight: 4096,
    },
    {
      type: 'TileMatrixType',
      identifier: '13',
      scaleDenominator: 266.59119798122214,
      topLeftCorner: [3586697.4097258747, 5051234.111622438],
      tileWidth: 256,
      tileHeight: 256,
      matrixWidth: 8192,
      matrixHeight: 8192,
    },
    {
      type: 'TileMatrixType',
      identifier: '14',
      scaleDenominator: 133.29559899061107,
      topLeftCorner: [3586697.4097258747, 5051234.111622438],
      tileWidth: 256,
      tileHeight: 256,
      matrixWidth: 16384,
      matrixHeight: 16384,
    },
    {
      type: 'TileMatrixType',
      identifier: '15',
      scaleDenominator: 66.64779949530553,
      topLeftCorner: [3586697.4097258747, 5051234.111622438],
      tileWidth: 256,
      tileHeight: 256,
      matrixWidth: 32768,
      matrixHeight: 32768,
    },
  ],
  $generated: {
    package: '@basemaps/cli',
    version: 'v7.14.0-6-gfeb1ba3d',
    hash: 'feb1ba3dd7257ca574836d00ffad89aac3d7dbcf',
    createdAt: '2025-02-05T03:43:19.749Z',
  },
  $options: {
    sourceTileMatrix: 'NZTM2000Quad',
    zoomOffset: 6,
  },
};

export const Citm2000Tms = new TileMatrixSet(Citm2000Tmst);
