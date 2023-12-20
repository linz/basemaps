import assert from 'node:assert';
import { describe, it } from 'node:test';

import { BaseConfig, ConfigImagery } from '../../index.js';
import { ConfigBase } from '../base.js';
import { ConfigBundle, ConfigBundleParser } from '../config.bundle.js';
import { ConfigImageryParser } from '../imagery.js';

describe('BaseConfig', () => {
  it('should fail with no id prefix', () => {
    const raw: BaseConfig = { id: 'foo', name: 'bar' };
    assert.throws(() => ConfigBase.parse(raw));
  });
  it('should parse a config', () => {
    const raw: BaseConfig = { id: 'ts_foo', name: 'bar' };
    const obj = ConfigBase.parse(raw);
    assert.deepEqual(obj, raw);
  });
});

describe('ConfigBundle', () => {
  it('should parse a config', () => {
    const raw: ConfigBundle = {
      id: 'ts_foo',
      name: 'config-latest',
      hash: 'HPV7UAB97VZXMs7iryoPYksxRNEbbBsvroyvTak4vSjt',
      path: 's3://linz-basemaps/config/config-HPV7UAB97VZXMs7iryoPYksxRNEbbBsvroyvTak4vSjt.json.gz',
      assets: 's3://linz-basemaps/assets/assets-HPV7UAB97VZXMs7iryoPYksxRNEbbBsvroyvTak4vSjt.tar.co',
    };
    const obj = ConfigBundleParser.parse(raw);
    assert.deepEqual(obj, raw);
  });
});

describe('ConfigImagery', () => {
  it('should parse a config', () => {
    const raw: ConfigImagery = {
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
      files: [
        {
          x: 19254793.17314892,
          y: -5130453.338500966,
          width: 1222.9924525628148,
          height: 1222.9924525628148,
          name: '15-32128-20578',
        },
      ],
    };
    const obj = ConfigImageryParser.parse(raw);
    assert.deepEqual(obj, raw);
  });
});
