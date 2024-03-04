import assert from 'node:assert';
import { before, describe, it } from 'node:test';

import { DefaultTerrainRgbOutput } from '@basemaps/config';
import { fsa, FsMemory, LogConfig } from '@basemaps/shared';
import pLimit from 'p-limit';

import { ConfigJson } from '../json.config.js';

describe('tiff-loader', () => {
  const stac = {
    id: 'stac_id',
    title: 'stac_title',
  };

  before(async () => {
    // Write some test tiffs
    const mem = new FsMemory();
    const tmp = new FsMemory();
    fsa.register('source://', mem);
    fsa.register('tmp://', tmp);

    const rgbaTiff = new URL('../../../../__tests__/static/rgba8.google.tiff', import.meta.url);
    await fsa.write(new URL('source://source/rgba8/google.tiff'), await fsa.read(rgbaTiff));

    const demTiff = new URL(
      '../../../../__tests__/static/abel-tasman-and-golden-bay_2016_dem_1m_BP25_10000_0404.tiff',
      import.meta.url,
    );
    await fsa.write(new URL('source://source/dem/google.tiff'), await fsa.read(demTiff));

    await fsa.write(new URL('source://source/stac/01HQ99T8C965EXQM58WF6B6CJ0/collection.json'), JSON.stringify(stac));
    await fsa.write(new URL('source://source/stac/01HQ99T8C965EXQM58WF6B6CJ0/google.tiff'), await fsa.read(rgbaTiff));
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
    assert.equal(cfg.objects.size, 2, [...cfg.objects.values()].map((m) => m.id).join(', ')); // Should be a im_ and ts_

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

    assert.equal(cfg.objects.size, 2, [...cfg.objects.values()].map((m) => m.id).join(', ')); // Should be a im_ and ts_

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

  it('should load a one band float32 collection', async () => {
    const ts = {
      id: 'ts_dem',
      type: 'raster',
      title: 'GoogleExample',
      layers: [{ 3857: 'source://source/dem/', title: 'elevation-title', name: 'elevation-name' }],
      outputs: [DefaultTerrainRgbOutput],
    };

    const cfgUrl = new URL('tmp://config/ts_google.json');
    await fsa.write(cfgUrl, JSON.stringify(ts));

    const cfg = await ConfigJson.fromUrl(cfgUrl, pLimit(10), LogConfig.get());

    assert.equal(cfg.objects.size, 2, [...cfg.objects.values()].map((m) => m.id).join(', ')); // Should be a im_ and ts_

    const tsGoogle = await cfg.TileSet.get('ts_dem')!;
    assert.ok(tsGoogle);

    assert.equal(tsGoogle.title, 'GoogleExample');
    assert.equal(tsGoogle.format, 'webp');
    assert.equal(tsGoogle.layers.length, 1);
    assert.ok(tsGoogle.type === 'raster');
    assert.equal(tsGoogle.outputs?.length, 1);
    assert.deepEqual(tsGoogle.outputs, [DefaultTerrainRgbOutput]);

    const layerOne = tsGoogle?.layers[0];
    assert.ok(layerOne);

    const imgId = layerOne[3857];
    assert.ok(imgId);

    const img = await cfg.Imagery.get(imgId);

    assert.ok(img);
    assert.equal(img.files.length, 1);
    assert.deepEqual(img.bands, ['float32']);

    cfg.createVirtualTileSets();

    const ids = [imgId.replace('im_', 'ts_'), 'ts_' + img.name];

    for (const id of ids) {
      // Virtual tilesets should have outputs generated
      const tsIm = await cfg.TileSet.get(id);
      assert.ok(tsIm, id);
      assert.ok(tsIm.type === 'raster', id);
      assert.ok(tsIm.virtual, id);
      assert.equal(tsIm.outputs?.length, 2, id);
      assert.ok(tsIm.outputs?.find((f) => f.name === 'terrain-rgb'), id);
      assert.ok(tsIm.outputs?.find((f) => f.name === 'color-ramp'), id);
    }

    const tsAll = await cfg.TileSet.get('ts_all');
    assert.ok(tsAll, 'ts_all');
    // DEM/DSM layers should not be present in `ts_all` (TODO: where should they be stored)
    assert.equal(tsAll.layers.length, 0, 'ts_all');
  });
});
