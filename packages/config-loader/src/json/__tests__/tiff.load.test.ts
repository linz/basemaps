import assert from 'node:assert';
import { before, describe, it } from 'node:test';

import { fsa, FsMemory, LogConfig } from '@basemaps/shared';
import pLimit from 'p-limit';

import { ConfigJson } from '../json.config.js';

describe('tiff-loader', () => {
  // Write some test tiffs
  const mem = new FsMemory();
  fsa.register('source://', mem);

  const tmp = new FsMemory();
  fsa.register('tmp://', tmp);

  const stac = {
    id: 'stac_id',
    title: 'stac_title',
  };

  before(async () => {
    const tiffA = new URL('../../../../__tests__/static/rgba8.google.tiff', import.meta.url);
    await fsa.write(new URL('source://source/rgba8/google.tiff'), await fsa.read(tiffA));

    await fsa.write(new URL('source://source/stac/01HQ99T8C965EXQM58WF6B6CJ0/collection.json'), JSON.stringify(stac));
    await fsa.write(new URL('source://source/stac/01HQ99T8C965EXQM58WF6B6CJ0/google.tiff'), await fsa.read(tiffA));
  });

  it('should load a config with a example image', async () => {
    const ts = {
      id: 'ts_google',
      type: 'raster',
      title: 'GoogleExample',
      layers: [{ 3857: 'source://source/rgba8/', title: 'google_title', name: 'google_name' }],
    };

    const cfgUrl = new URL('tmp://config/ts_google.json');
    await fsa.write(cfgUrl, JSON.stringify(ts));

    const cfg = await ConfigJson.fromUrl(cfgUrl, pLimit(10), LogConfig.get());
    assert.equal(cfg.objects.size, 2); // Should be a im_ and ts_

    const tsGoogle = await cfg.TileSet.get('ts_google')!;
    assert.ok(tsGoogle);

    assert.equal(tsGoogle.title, 'GoogleExample');
    assert.equal(tsGoogle.format, 'webp');
    assert.equal(tsGoogle.layers.length, 1);

    const layerOne = tsGoogle?.layers[0];
    assert.ok(layerOne);

    const imgId = layerOne[3857];
    assert.ok(imgId);

    const img = await cfg.Imagery.get(imgId);

    assert.ok(img);
    assert.equal(img.files.length, 1);
    assert.deepEqual(img.bands, ['uint8', 'uint8', 'uint8', 'uint8']);
  });

  it('should load a config with a stac collection', async () => {
    const ts = {
      id: 'ts_google',
      type: 'raster',
      title: 'GoogleExample',
      layers: [
        { 3857: 'source://source/stac/01HQ99T8C965EXQM58WF6B6CJ0/', title: 'google_title', name: 'google_name' },
      ],
    };

    const cfgUrl = new URL('tmp://config/ts_google.json');
    await fsa.write(cfgUrl, JSON.stringify(ts));

    const cfg = await ConfigJson.fromUrl(cfgUrl, pLimit(10), LogConfig.get());

    assert.equal(cfg.objects.size, 2); // Should be a im_ and ts_

    const tsGoogle = await cfg.TileSet.get('ts_google')!;
    assert.ok(tsGoogle);

    assert.equal(tsGoogle.title, 'GoogleExample');
    assert.equal(tsGoogle.format, 'webp');
    assert.equal(tsGoogle.layers.length, 1);

    const layerOne = tsGoogle?.layers[0];
    assert.ok(layerOne);

    const imgId = layerOne[3857];
    assert.ok(imgId);
    assert.equal(imgId, 'im_01HQ99T8C965EXQM58WF6B6CJ0');

    const img = await cfg.Imagery.get(imgId);

    assert.ok(img);
    assert.equal(img.files.length, 1);
    assert.deepEqual(img.bands, ['uint8', 'uint8', 'uint8', 'uint8']);
  });
});
