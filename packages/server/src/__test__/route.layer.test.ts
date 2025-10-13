import assert from 'node:assert';
import { before, beforeEach, describe, it } from 'node:test';

import { ConfigProviderMemory } from '@basemaps/config';
import { ConfigJson, initConfigFromUrls } from '@basemaps/config-loader';
import { fsa, FsMemory, LogConfig, VNodeElement } from '@basemaps/shared';
import { TestTiff } from '@basemaps/test';
import pLimit from 'p-limit';

import { createLayersHtmlDom } from '../route.layers.js';

function describeLayers(el: VNodeElement): string[] {
  const output = [];
  for (const t of el.tags('div')) {
    if (!t.attrs['class'].startsWith('layer-header')) continue;
    output.push(t.children.map((m) => m.textContent).join('\t'));
  }
  return output;
}

describe('route.layers', () => {
  const fsMemory = new FsMemory();

  before(() => fsa.register('memory://', fsMemory));
  beforeEach(() => fsMemory.files.clear());

  it('should render rgb layers', async () => {
    await fsa.write(new URL('memory://input/new_imagery/nztm2000.tiff'), fsa.readStream(TestTiff.Nztm2000));

    const mem = new ConfigProviderMemory();
    await initConfigFromUrls(mem, [new URL('memory://input/new_imagery/')]);

    const ret = await createLayersHtmlDom(mem);
    const layers = describeLayers(ret);

    assert.deepEqual(layers, ['new_imagery\tTileMatrix: NZTM2000Quad\tPipeline: rgba\tEPSG:2193']);
  });

  it('should render rgbi layers', async () => {
    await fsa.write(new URL('memory://input/new_imagery/nztm2000.tiff'), fsa.readStream(TestTiff.Rgbi16));

    const mem = new ConfigProviderMemory();
    await initConfigFromUrls(mem, [new URL('memory://input/new_imagery/')]);

    const ret = await createLayersHtmlDom(mem);
    const layers = describeLayers(ret);

    assert.deepEqual(layers, [
      'new_imagery\tTileMatrix: WebMercatorQuad\tPipeline: rgb\tEPSG:3857',
      'new_imagery\tTileMatrix: WebMercatorQuad\tPipeline: ndvi\tEPSG:3857',
      'new_imagery\tTileMatrix: WebMercatorQuad\tPipeline: false-color\tEPSG:3857',
    ]);
  });

  it('should render from json config', async () => {
    await fsa.write(new URL('memory://input/new_imagery/nztm2000.tiff'), fsa.readStream(TestTiff.Nztm2000));
    await fsa.write(
      new URL('memory://input/config/aerial.json'),
      JSON.stringify({
        type: 'raster',
        id: 'ts_aerial',
        title: 'Aerial Imagery Basemap',
        category: 'Basemaps',
        background: 'dce9edff',
        layers: [
          {
            '2193': 'memory://input/new_imagery/',
            name: 'new-zealand_2024-2025_10m',
            title: 'New Zealand 2024-2025 10m',
            category: 'Satellite Imagery',
          },
        ],
      }),
    );

    const mem = await ConfigJson.fromUrl(new URL('memory://input/config/'), pLimit(1), LogConfig.get());
    const ret = await createLayersHtmlDom(mem);
    const layers = describeLayers(ret);

    assert.deepEqual(layers, [
      // TODO: we should render the aerial layer as it is specified in the config, currently it is ignored
      //      'Aerial Imagery Basemap\tTileMatrix: WebMercatorQuad\tPipeline: rgba\tEPSG:3857',
      'New Zealand 2024-2025 10m\tTileMatrix: NZTM2000Quad\tPipeline: rgba\tEPSG:2193',
    ]);
  });
});
