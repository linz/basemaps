import assert from 'node:assert';
import { before, describe, it } from 'node:test';

import { ConfigTileSetRaster, DefaultTerrainRgbOutput, TileSetType } from '@basemaps/config';
import { fsa, FsMemory, LogConfig, SourceMemory, Tiff, TiffTag } from '@basemaps/shared';
import pLimit from 'p-limit';

import { ConfigJson } from '../json.config.js';
import { TileSetConfigSchema } from '../parse.tile.set.js';
import { ConfigImageryTiff } from '../tiff.config.js';

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

    const tsGoogle = await cfg.TileSet.get('ts_google');
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
    assert.deepEqual(
      img.bands?.map((m) => m.type),
      ['uint8', 'uint8', 'uint8', 'uint8'],
    );
  });

  it('should import a rgbi tiff', async () => {
    const rgbiTiff = new URL('../../../../__tests__/static/rgbi16.stats.tiff', import.meta.url);
    await fsa.write(new URL('source://source/rgbi/google.tiff'), await fsa.read(rgbiTiff));

    const ts = {
      id: 'ts_google',
      type: 'raster',
      title: 'GoogleExample',
      layers: [{ 3857: 'source://source/rgbi/', title: 'google_title', name: 'google_name' }],
    };

    const cfgUrl = new URL('tmp://config/ts_google.json');
    await fsa.write(cfgUrl, JSON.stringify(ts));

    const cfg = await ConfigJson.fromUrl(cfgUrl, pLimit(10), LogConfig.get());
    const tsGoogle = await cfg.TileSet.get('ts_google');
    assert.ok(tsGoogle);

    const layerOne = tsGoogle?.layers[0];
    assert.ok(layerOne);

    const imgId = layerOne[3857];
    assert.ok(imgId);

    const img = await cfg.Imagery.get(imgId);

    assert.ok(img?.bands);
    assert.deepEqual(
      img.bands.map((m) => m.type),
      ['uint16', 'uint16', 'uint16', 'uint16'],
    );
    assert.deepEqual(
      img.bands.map((m) => m.color),
      ['red', 'green', 'blue', 'nir'],
    );
    assert.deepEqual(
      img.bands.map((m) => m.stats),
      [
        { max: 255, mean: 128, min: 2 },
        { max: 255, mean: 95.75, min: 0 },
        { max: 255, mean: 64.5, min: 0 },
        { max: 255, mean: 255, min: 255 },
      ],
    );
  });

  it('should default to uint if data type is missing', async () => {
    const rgbaTiff = new URL('../../../../__tests__/static/rgba8.google.tiff', import.meta.url);
    const bytes = await fsa.read(rgbaTiff);
    const tiff = await Tiff.create(new SourceMemory(`memory://rgbaTiff`, bytes));
    // find the offset for the tag then overwrite the data
    const bytesTag = tiff.images[0].tags.get(TiffTag.SampleFormat);
    if (bytesTag == null) throw new Error('Unable to destroy tag information');
    // rename the tag to UserComment
    bytes.writeUint16LE(TiffTag.UserComment, bytesTag.tagOffset);

    // check to ensure that the tag was properly destroyed
    const tiffB = await Tiff.create(new SourceMemory(`memory://rgbaTiff`, bytes));
    assert.ok(tiffB.images[0].tags.get(TiffTag.SampleFormat) == null);
    assert.ok(tiffB.images[0].tags.get(TiffTag.UserComment));

    await fsa.write(new URL('source://source/rgba-missing-datatype/google.tiff'), bytes);

    const ts = {
      id: 'ts_google',
      type: 'raster',
      title: 'GoogleExample',
      layers: [{ 3857: 'source://source/rgba-missing-datatype/', title: 'google_title', name: 'google_name' }],
    };

    const cfgUrl = new URL('tmp://config/ts_google.json');
    await fsa.write(cfgUrl, JSON.stringify(ts));

    const cfg = await ConfigJson.fromUrl(cfgUrl, pLimit(10), LogConfig.get());
    assert.equal(cfg.objects.size, 2, [...cfg.objects.values()].map((m) => m.id).join(', ')); // Should be a im_ and ts_

    const tsGoogle = await cfg.TileSet.get('ts_google');
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

    assert.deepEqual(
      img.bands?.map((m) => m.type),
      ['uint8', 'uint8', 'uint8', 'uint8'],
    );
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

    const tsGoogle = await cfg.TileSet.get('ts_google');
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
    assert.deepEqual(
      img.bands?.map((b) => b.type),
      ['uint8', 'uint8', 'uint8', 'uint8'],
    );
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

    const tsGoogle = await cfg.TileSet.get('ts_dem');
    assert.ok(tsGoogle);

    assert.equal(tsGoogle.title, 'GoogleExample');
    assert.equal(tsGoogle.format, 'webp');
    assert.equal(tsGoogle.layers.length, 1);
    assert.ok(tsGoogle.type === TileSetType.Raster);
    assert.equal(tsGoogle.outputs?.length, 1);
    assert.deepEqual(tsGoogle.outputs, [DefaultTerrainRgbOutput]);

    const layerOne = tsGoogle?.layers[0];
    assert.ok(layerOne);

    const imgId = layerOne[3857];
    assert.ok(imgId);

    const img = await cfg.Imagery.get(imgId);

    assert.ok(img);
    assert.equal(img.files.length, 1);

    assert.deepEqual(
      img.bands?.map((m) => m.type ?? ''),
      ['float32'],
    );

    assert.ok(img.bands?.[0]?.stats?.min);
    assert.ok(img.bands?.[0]?.stats?.max);

    cfg.createVirtualTileSets();

    const ids = [imgId.replace('im_', 'ts_'), 'ts_' + img.name];

    for (const id of ids) {
      // Virtual tilesets should have outputs generated
      const tsIm = await cfg.TileSet.get(id);
      assert.ok(tsIm, id);
      assert.ok(tsIm.type === TileSetType.Raster, id);
      assert.ok(tsIm.virtual, id);
      assert.equal(tsIm.outputs?.length, 2, id);
      assert.ok(
        tsIm.outputs?.find((f) => f.name === 'terrain-rgb'),
        id,
      );
      assert.ok(
        tsIm.outputs?.find((f) => f.name === 'color-ramp'),
        id,
      );
    }

    const tsAll = await cfg.TileSet.get('ts_all');
    assert.ok(tsAll, 'ts_all');
    // DEM/DSM layers should not be present in `ts_all` (TODO: where should they be stored)
    assert.equal(tsAll.layers.length, 0, 'ts_all');
  });

  it('should load a with a cache', async () => {
    const ts = {
      id: 'ts_dem',
      type: 'raster',
      title: 'GoogleExample',
      layers: [{ 3857: 'source://source/dem/', title: 'elevation-title', name: 'elevation-name' }],
      outputs: [DefaultTerrainRgbOutput],
    };

    const cfgUrl = new URL('tmp://config/ts_google.json');
    await fsa.write(cfgUrl, JSON.stringify(ts));

    await ConfigJson.fromUrl(cfgUrl, pLimit(10), LogConfig.get(), new URL('tmp://cache/'));

    const files = await fsa.toArray(fsa.details(fsa.toUrl('tmp://cache/')));
    assert.equal(files.length, 1);

    const data = await fsa.readJson<ConfigImageryTiff>(files[0].url);
    assert.equal(data.name, 'dem');

    await ConfigJson.fromUrl(cfgUrl, pLimit(10), LogConfig.get(), new URL('tmp://cache/'));

    const filesB = await fsa.toArray(fsa.details(fsa.toUrl('tmp://cache/')));
    assert.equal(filesB.length, 1);
  });

  it('should support rgba color objects ', async () => {
    const ts: TileSetConfigSchema = {
      id: 'ts_dem',
      type: TileSetType.Raster,
      title: 'GoogleExample',
      layers: [{ 3857: 'source://source/dem/', title: 'elevation-title', name: 'elevation-name' }],
      background: { r: 255, g: 0, b: 255, alpha: 1 },
      outputs: [DefaultTerrainRgbOutput],
    };

    const cfgUrl = new URL('tmp://config/ts_google.json');
    await fsa.write(cfgUrl, JSON.stringify(ts));

    const cfg = await ConfigJson.fromUrl(cfgUrl, pLimit(10), LogConfig.get(), new URL('tmp://cache/'));
    const tsOut = (await cfg.TileSet.get('ts_dem')) as ConfigTileSetRaster;
    assert.deepEqual(tsOut.background, { r: 255, g: 0, b: 255, alpha: 1 });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (ts as any).background = '#ff00ffff';
    await fsa.write(cfgUrl, JSON.stringify(ts));

    const cfgStr = await ConfigJson.fromUrl(cfgUrl, pLimit(10), LogConfig.get(), new URL('tmp://cache/'));
    const tsOutStr = (await cfgStr.TileSet.get('ts_dem')) as ConfigTileSetRaster;
    assert.deepEqual(tsOutStr.background, { r: 255, g: 0, b: 255, alpha: 255 });
  });
});
