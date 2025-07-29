import assert from 'node:assert';
import { before, describe, it, TestContext } from 'node:test';

import { ConfigLayer, ConfigProviderMemory, ConfigTileSetRaster, getAllImagery, sha256base58 } from '@basemaps/config';
import { ConfigJson } from '@basemaps/config-loader';
import { ConfigImageryTiff } from '@basemaps/config-loader/build/json/tiff.config.js';
import { TileSetConfigSchema, TileSetConfigSchemaLayer } from '@basemaps/config-loader/src/json/parse.tile.set.js';
import { Epsg, EpsgCode, TileMatrixSets } from '@basemaps/geo';
import { fsa, FsMemory, LogConfig } from '@basemaps/shared';
import pLimit from 'p-limit';

import { outputChange } from '../cli/action.import.js';
import { TsAerial } from './config.diff.data.js';
import { configDiff, DiffNew, DiffRemoved } from './config.diff.js';

describe('config.diff', () => {
  const fsMem = new FsMemory();

  before(() => {
    // Imagery is linked from s3, overwrite s3 links to just use memory
    fsa.register('s3://', fsMem);

    fsa.register('source://', fsMem);
    fsa.register('before://', fsMem);
    fsa.register('after://', fsMem);

    fsMem.files.clear();
    fsa.write(fsa.toUrl('before://config/tileset/aerial.json'), JSON.stringify(TsAerial));
  });

  async function stubLoadConfig(t: TestContext, source: string): Promise<ConfigProviderMemory> {
    t.mock.method(ConfigJson.prototype, 'initImageryFromTiffUrl', (url: URL) => {
      // const imageryName = getImageryName(url);
      const parts = url.pathname.split('/');
      const projection = TileMatrixSets.get(Epsg.parseCode(parts[1]) as EpsgCode);
      const imageryName = parts[2];

      const gsd = imageryName.split('_').at(-1);
      const imagery: ConfigImageryTiff = {
        id: `im_${sha256base58(url.href)}`,
        name: imageryName,
        title: imageryName,
        updatedAt: Date.now(),
        projection: projection?.projection.code,
        tileMatrix: projection?.identifier ?? 'none',
        gsd: parseFloat(gsd ?? '100'),
        uri: url.href,
        url: url,
        bounds: { x: 0, y: 0, width: 0, height: 0 },
        files: [],
      };
      return Promise.resolve(imagery);
    });

    const mem = await ConfigJson.fromUrl(new URL(source), pLimit(1), LogConfig.get());
    mem.createVirtualTileSets(false);
    return mem;
  }

  it('should load the aerial config', async (t) => {
    const cfg = await stubLoadConfig(t, 'before://config/');

    const tsAerial = await cfg.TileSet.get('aerial');
    assert.ok(tsAerial, 'Should have loaded the aerial tile set');

    assert.equal(tsAerial.layers.length, 3);

    const all3857 = await getAllImagery(cfg, tsAerial.layers, [Epsg.Google]);

    assert.equal(all3857.size, 3, 'Should have 3 layers in the 3857 tile set');
    for (const layer of all3857.values()) {
      const tsId = `ts_${layer.name}`;
      assert.ok(cfg.objects.has(tsId), `Should have a tile set for ${layer.name}`);
    }
  });

  it('should not have any changes when nothing has changed', async (t) => {
    const before = await stubLoadConfig(t, 'before://config/');
    const after = await stubLoadConfig(t, 'before://config/');

    const diff = configDiff(before, after);

    assert.deepEqual(diff, { raster: [] }, 'Should not have any changes when nothing has changed');
  });

  it('should diff when a layer is removed', async (t) => {
    const before = await stubLoadConfig(t, 'before://config/');

    const tsAfter = structuredClone(TsAerial);
    tsAfter.layers.shift(); // Remove the first layer
    await fsa.write(fsa.toUrl('after://config/tileset/aerial.json'), JSON.stringify(tsAfter));
    const after = await stubLoadConfig(t, 'after://config/');
    const diff = configDiff(before, after);

    assert.equal(diff.raster.length, 1, 'Should only have one diff');
    const firstDiff = diff.raster[0] as DiffRemoved<ConfigTileSetRaster>;
    assert.equal(firstDiff.type, 'removed');
    assert.equal(firstDiff.before.id, 'ts_grey-2025-0.075m');
  });

  it('should diff when a layer is added', async (t) => {
    const before = await stubLoadConfig(t, 'before://config/');

    const tsAfter = structuredClone(TsAerial);
    tsAfter.layers.push(layerConfig('test-layer', 'Test layer')); // Remove the first layer
    await fsa.write(fsa.toUrl('after://config/tileset/aerial.json'), JSON.stringify(tsAfter));
    const after = await stubLoadConfig(t, 'after://config/');
    const diff = configDiff(before, after);

    assert.equal(diff.raster.length, 1, 'Should only have one diff');
    const firstDiff = diff.raster[0] as DiffNew<ConfigTileSetRaster>;
    assert.equal(firstDiff.type, 'new');
    assert.equal(firstDiff.after.id, 'ts_test-layer');
  });

  it('should show no layer diffs when a layer is removed then added as a seperate config', async (t) => {
    const before = await stubLoadConfig(t, 'before://config/');
    const tsAfter = structuredClone(TsAerial);

    // Remove the first layer then store it as a seperate tile set config file
    const removed = tsAfter.layers.shift() as TileSetConfigSchemaLayer; // Remove the first layer
    await fsa.write(fsa.toUrl('after://config/tileset/aerial.json'), JSON.stringify(tsAfter));
    await fsa.write(
      fsa.toUrl(`after://config/tileset/imagery/${removed.title}.json`),
      JSON.stringify({
        type: 'raster',
        id: `ts_${removed.name}`,
        name: removed.name,
        title: removed.title,
        category: removed.category,
        layers: [removed],
        minZoom: removed.minZoom,
      } as TileSetConfigSchema),
    );
    const after = await stubLoadConfig(t, 'after://config/');
    const diff = configDiff(before, after);

    assert.equal(diff.raster.length, 0, 'should have no diff');

    const doc = await outputChange(after, before, 'after://config/tileset/aerial.json', []);
    const lines = doc.split('\n');

    // TODO this is the bug that needs to be fixed.
    assert.ok(lines.find((f) => f.includes('Aerial Imagery Deletes')));
  });
});

function layerConfig(name: string, title: string): ConfigLayer {
  return {
    '2193': `source://linz-basemaps/2193/${name}/${sha256base58(name + '2193')}/`,
    '3857': `source://linz-basemaps/3857/${name}/${sha256base58(name + '3857')}/`,
    name,
    title,
    category: 'Urban Aerial Photos',
    minZoom: 14,
  };
}
