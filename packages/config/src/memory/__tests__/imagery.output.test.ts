import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';

import { ConfigImagery } from '../../config/imagery.js';
import { ConfigTileSetRaster, TileSetType } from '../../config/tile.set.js';
import { addDefaultOutputPipelines } from '../imagery.outputs.js';

describe('MemoryConfig', () => {
  const im: ConfigImagery = {
    v: 2,
    id: 'im_01FBGB0T73562VAZBEBHZ7E84T',
    name: 'tasman-rural-2020-0.3m',
    title: 'Tasman 0.3m Rural Aerial Photos (2020)',
    projection: 3857,
    tileMatrix: 'WebMercatorQuad',
    uri: 's3://linz-basemaps/3857/tasman_rural_2020_0-3m_RGB/01FBGB0T73562VAZBEBHZ7E84T/',
    category: 'Rural Aerial Photos',
    bounds: {
      x: 19137385.897703003,
      y: -5224623.757348378,
      width: 136975.1546870321,
      height: 176110.91316904593,
    },
    files: [],
    bands: [{ type: 'uint8', color: 'gray' }] as const,
  };
  const ts: ConfigTileSetRaster = {
    id: 'ts_01FBGB0T73562VAZBEBHZ7E84T',
    title: 'test',
    type: TileSetType.Raster,
    name: 'tasman-rural-2020-0.3m',
    layers: [{ name: im.name, title: im.title, 3857: im.id }],
  };

  beforeEach(() => {
    delete ts.outputs;
  });

  it('should expand 1 band gray scale into 4 band rgba', () => {
    const img = structuredClone(im);
    img.bands = [{ type: 'uint8', color: 'gray' }];

    const ret = addDefaultOutputPipelines(ts, im);
    assert.deepEqual(ret, [
      {
        title: 'Gray',
        name: 'expand',
        pipeline: [{ type: 'color-ramp' }],
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    ]);
  });

  it('should convert 1 band elevation scale into 4 band rgba', () => {
    const img = structuredClone(im);
    img.bands = [{ type: 'float32' }];

    const ret = addDefaultOutputPipelines(ts, img);
    assert.deepEqual(
      ret?.map((m) => m.name),
      ['terrain-rgb', 'color-ramp'],
    );
  });
});
