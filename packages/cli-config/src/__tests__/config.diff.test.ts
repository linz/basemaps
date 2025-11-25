import assert from 'node:assert';
import { before, beforeEach, describe, it, TestContext } from 'node:test';

import { ConfigLayer, ConfigProviderMemory, ConfigTileSetRaster, getAllImagery, sha256base58 } from '@basemaps/config';
import { ConfigJson } from '@basemaps/config-loader';
import { ConfigImageryTiff } from '@basemaps/config-loader/build/json/tiff.config.js';
import { TileSetConfigSchema, TileSetConfigSchemaLayer } from '@basemaps/config-loader/src/json/parse.tile.set.js';
import { Epsg, EpsgCode, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { fsa, FsMemory, LogConfig } from '@basemaps/shared';
import pLimit from 'p-limit';

import {
  configTileSetDiff,
  DiffNew,
  DiffRemoved,
  DiffTileSet,
  DiffTileSetRasterUpdated,
} from '../cli/diff/config.diff.js';
import { diffToMarkdown } from '../cli/diff/config.diff.markdown.js';
import { TsAerial, TsElevation, TsIndividual } from './config.diff.data.js';

function splitUrlIntoParts(e: URL): { tileMatrix: TileMatrixSet; name: string; gsd: number } {
  const parts = e.pathname.slice(1).split('/');

  if (e.hostname === 'linz-basemaps') {
    // /3857/:name/:id/
    let partOffset = 0;
    // /elevation/3857/:name/:id/
    if (parts[0] === 'elevation') partOffset++;

    return {
      tileMatrix: TileMatrixSets.get(Epsg.parseCode(parts[partOffset]) as EpsgCode),
      name: parts[partOffset + 1],
      gsd: parseFloat(parts[partOffset + 1].split('_').at(-1) ?? '0'),
    };
  }
  if (e.hostname === 'nz-imagery' || e.hostname === 'nz-elevation') {
    return {
      tileMatrix: TileMatrixSets.get(Epsg.parseCode(parts[3]) as EpsgCode),
      name: parts[1],
      gsd: 1,
    };
  }

  throw new Error('Unable to parse path: ' + e.href);
}

function formatJson(url: URL, bytes: Buffer): string | Buffer {
  if (url.pathname.endsWith('.json')) return JSON.stringify(JSON.parse(String(bytes)), null, 2);
  return bytes;
}

const ShouldDumpState: boolean = true;
async function dumpState(name: string, diff: DiffTileSet, markdown = diffToMarkdown(diff)): Promise<void> {
  if (ShouldDumpState === false) return;
  const testName = `${name.replaceAll(' > ', '/')}`;
  const output = fsa.toUrl(`./configs/${testName}/`);

  for (const loc of ['before', 'after']) {
    for await (const f of fsa.list(fsa.toUrl(`${loc}://`))) {
      const bytes = await fsa.read(f);
      await fsa.write(new URL(`${loc}/` + f.pathname.slice(1), output), formatJson(f, bytes));
    }
  }

  await fsa.write(new URL('before/config.json', output), JSON.stringify(diff.before.toJson(), null, 2));
  await fsa.write(new URL('after/config.json', output), JSON.stringify(diff.after.toJson(), null, 2));
  await fsa.write(new URL(name + '.md', output), markdown);
}

describe('config.diff', () => {
  const fsMem = new FsMemory();
  const aerialJson = JSON.stringify(TsAerial);

  before(() => {
    // Imagery is linked from s3, overwrite s3 links to just use memory
    fsa.register('s3://', fsMem);

    fsa.register('source://', fsMem);
    fsa.register('before://', fsMem);
    fsa.register('after://', fsMem);

    LogConfig.get().level = 'silent';
  });

  async function stubLoadConfig(t: TestContext, source: string): Promise<ConfigProviderMemory> {
    t.mock.method(ConfigJson.prototype, 'initImageryFromTiffUrl', (url: URL) => {
      const parts = splitUrlIntoParts(url);

      const imagery: ConfigImageryTiff = {
        v: 2,
        id: `im_${sha256base58(url.href)}`,
        name: parts.name,
        title: parts.name,
        updatedAt: Date.now(),
        projection: parts.tileMatrix.projection.code,
        tileMatrix: parts.tileMatrix.identifier ?? 'none',
        gsd: parts.gsd,
        uri: url.href,
        url: url,
        bounds: { x: 0, y: 0, width: 0, height: 0 },
        bands: [
          { type: 'uint8', color: 'red' },
          { type: 'uint8', color: 'green' },
          { type: 'uint8', color: 'blue' },
          { type: 'uint8', color: 'alpha' },
        ],
        files: [],
      };
      return Promise.resolve(imagery);
    });

    const mem = await ConfigJson.fromUrl(new URL(source), pLimit(1), LogConfig.get());
    mem.createVirtualTileSets();
    return mem;
  }

  it.skip('should load the aerial config', async (t) => {
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

    const diff = configTileSetDiff(before, after);
    await dumpState(t.fullName, diff);

    assert.deepEqual(diff.raster, [], 'Should not have any changes when nothing has changed');
    assert.deepEqual(diff.vector, [], 'Should not have any changes when nothing has changed');
  });

  describe('aerial', () => {
    beforeEach(async () => {
      fsMem.files.clear();
      await fsa.write(fsa.toUrl('before://config/tileset/aerial.json'), aerialJson);
    });

    it('should diff when a layer is removed', async (t) => {
      const before = await stubLoadConfig(t, 'before://config/');

      const tsAfter = structuredClone(TsAerial);
      const rem = tsAfter.layers.shift(); // Remove the first layer
      await fsa.write(fsa.toUrl('after://config/tileset/aerial.json'), JSON.stringify(tsAfter));
      const after = await stubLoadConfig(t, 'after://config/');
      const diff = configTileSetDiff(before, after);
      await dumpState(t.fullName, diff);

      const diffAll = diff.raster.find((f) => f.id === 'ts_all') as DiffTileSetRasterUpdated;
      const diffAerial = diff.raster.find((f) => f.id === 'ts_aerial') as DiffTileSetRasterUpdated;
      const diffLayer = diff.raster.find((f) => f.id === 'ts_' + rem?.name) as DiffRemoved<ConfigTileSetRaster>;

      assert.equal(diffAll?.type, 'updated');
      assert.equal(diffAerial?.type, 'updated');
      assert.equal(diffLayer?.type, 'removed');

      // Both all and aerial will have one change removing the one tile set
      assert.deepEqual(
        diffAll.layers.map((m) => [m.type, m.id].join(':')),
        ['removed:grey-2025-0.075m'],
      );
      assert.deepEqual(
        diffAerial.layers.map((m) => [m.type, m.id].join(':')),
        ['removed:grey-2025-0.075m'],
      );
    });

    it('should diff when a layer is added', async (t) => {
      const before = await stubLoadConfig(t, 'before://config/');

      const tsAfter = structuredClone(TsAerial);
      tsAfter.layers.push(fakeLayerConfig('test-layer', 'Test layer')); // Remove the first layer
      await fsa.write(fsa.toUrl('after://config/tileset/aerial.json'), JSON.stringify(tsAfter));
      const after = await stubLoadConfig(t, 'after://config/');
      const diff = configTileSetDiff(before, after);
      await dumpState(t.fullName, diff);

      const diffAll = diff.raster.find((f) => f.id === 'ts_all') as DiffTileSetRasterUpdated;
      const diffAerial = diff.raster.find((f) => f.id === 'ts_aerial') as DiffTileSetRasterUpdated;
      const diffLayer = diff.raster.find((f) => f.id === 'ts_test-layer') as DiffNew<ConfigTileSetRaster>;

      assert.equal(diffAll?.type, 'updated');
      assert.equal(diffAerial?.type, 'updated');
      assert.equal(diffLayer?.type, 'new');

      // Both all and aerial will have one new layer
      assert.deepEqual(
        diffAll.layers.map((m) => [m.type, m.id].join(':')),
        ['new:test-layer'],
      );
      assert.deepEqual(
        diffAerial.layers.map((m) => [m.type, m.id].join(':')),
        ['new:test-layer'],
      );
    });

    it("should show a change when a layer's source is updated", async (t) => {
      const before = await stubLoadConfig(t, 'before://config/');

      // Change the layer location for the after to new-layer-id
      const tsAfter = structuredClone(TsAerial);
      const layer = tsAfter.layers[0];
      const newLayerId = 'new-layer-id';
      layer[2193] = layer[2193]?.replace(layer[2193]?.split('/').at(-2) ?? '', newLayerId + '-2193');
      layer[3857] = layer[3857]?.replace(layer[3857]?.split('/').at(-2) ?? '', newLayerId + '-3857');
      await fsa.write(fsa.toUrl('after://config/tileset/aerial.json'), JSON.stringify(tsAfter));
      const after = await stubLoadConfig(t, 'after://config/');

      const diff = configTileSetDiff(before, after);
      await dumpState(t.fullName, diff);

      const allDiff = diff.raster.find((m) => m.id === 'ts_all') as DiffTileSetRasterUpdated;
      const aerialDiff = diff.raster.find((m) => m.id === 'ts_aerial') as DiffTileSetRasterUpdated;
      const layerDiff = diff.raster.find((m) => m.id === 'ts_' + layer.name) as DiffTileSetRasterUpdated;
      assert.equal(allDiff?.type, 'updated', 'ts_all should have updated');
      assert.equal(aerialDiff?.type, 'updated', 'ts_aerial should have updated');
      assert.equal(layerDiff?.type, 'updated', `ts_${layer.name} should have updated`);

      // No tile set level changes
      assert.equal(allDiff.changes, undefined);
      assert.equal(aerialDiff.changes, undefined);
      assert.equal(layerDiff.changes, undefined);

      assert.equal(allDiff.layers.length, 1);
      assert.equal(allDiff.layers[0].type, 'updated');
      assert.equal(allDiff.layers[0].id, 'grey-2025-0.075m');

      assert.equal(layerDiff.layers.length, 1);
      assert.equal(layerDiff.layers[0].type, 'updated');
      assert.equal(layerDiff.layers[0].id, 'grey-2025-0.075m');

      assert.equal(aerialDiff.layers.length, 1);
      assert.equal(aerialDiff.layers[0].type, 'updated');
      assert.equal(aerialDiff.layers[0].id, 'grey-2025-0.075m');
    });

    it('should show no layer diffs when a layer is removed then added as a separate config', async (t) => {
      const before = await stubLoadConfig(t, 'before://config/');
      const tsAfter = structuredClone(TsAerial);

      // Remove the first layer then store it as a separate tile set config file
      const removed = tsAfter.layers.shift() as TileSetConfigSchemaLayer; // Remove the first layer
      await fsa.write(fsa.toUrl('after://config/tileset/aerial.json'), JSON.stringify(tsAfter));
      await fsa.write(
        fsa.toUrl(`after://config/tileset/imagery/${removed.title}.json`),
        JSON.stringify(fakeLayerConfigFile(removed)),
      );

      const after = await stubLoadConfig(t, 'after://config/');
      const diff = configTileSetDiff(before, after);
      await dumpState(t.fullName, diff);

      const firstDiff = diff.raster[0] as DiffTileSetRasterUpdated;
      assert.ok(firstDiff, 'should have a diff');
      // Aerial Layer should be updated
      assert.equal(firstDiff.id, 'ts_aerial');
      assert.equal(firstDiff.type, 'updated');
      // Layer removed
      assert.equal(firstDiff.layers[0].id, 'grey-2025-0.075m');
      assert.equal(firstDiff.layers[0].type, 'removed');

      // **FIXME There really shouldn't be any changes here
      // Virtual layers do not add a default "format: webp"
      // When reading a tileset it adds the default of "format: webp"
      // so it triggers a diff
      const secondDiff = diff.raster[1] as DiffTileSetRasterUpdated;
      assert.equal(secondDiff.id, 'ts_grey-2025-0.075m');
      assert.equal(secondDiff.type, 'updated');
      assert.deepEqual(
        secondDiff.changes.map((m) => m.path?.join('.')),
        ['format', 'aliases'],
      );
    });

    it('should show a removal when the config is miss labeled', async (t) => {
      const before = await stubLoadConfig(t, 'before://config/');
      const tsAfter = structuredClone(TsAerial);

      // Remove the first layer then store it as a seperate tile set config file
      const removed = tsAfter.layers.shift() as TileSetConfigSchemaLayer; // Remove the first layer
      await fsa.write(fsa.toUrl('after://config/tileset/aerial.json'), JSON.stringify(tsAfter));
      await fsa.write(
        fsa.toUrl(`after://config/tileset/imagery/${removed.title}`),
        JSON.stringify(fakeLayerConfigFile(removed)),
      );
      const after = await stubLoadConfig(t, 'after://config/');
      const diff = configTileSetDiff(before, after);
      await dumpState(t.fullName, diff);

      const diffAll = diff.raster.find((m) => m.id === 'ts_all') as DiffTileSetRasterUpdated;
      const diffAerial = diff.raster.find((m) => m.id === 'ts_aerial') as DiffTileSetRasterUpdated;
      const diffLayer = diff.raster.find((m) => m.id === 'ts_' + removed.name) as DiffTileSetRasterUpdated;

      assert.equal(diffAll?.type, 'updated', 'ts_all should have updated');
      assert.equal(diffAerial?.type, 'updated', 'ts_aerial should have updated');
      assert.equal(diffLayer?.type, 'removed', `ts_${removed.name} should have updated`);

      assert.deepEqual(
        diffAll.layers.map((m) => [m.type, m.id].join(':')),
        ['removed:' + removed.name],
      );
      assert.deepEqual(
        diffAerial.layers.map((m) => [m.type, m.id].join(':')),
        ['removed:' + removed.name],
      );
    });
  });

  describe('individual', () => {
    beforeEach(async () => {
      fsMem.files.clear();
      await fsa.write(fsa.toUrl('before://config/tileset/aerial.json'), aerialJson);
      await fsa.write(fsa.toUrl('after://config/tileset/aerial.json'), aerialJson);
    });

    it('should do show a diff when a new individual dataset is added', async (t) => {
      const before = await stubLoadConfig(t, 'before://config/');
      await fsa.write(
        fsa.toUrl('after://config/tileset/' + TsIndividual.layers[0].name + '.json'),
        JSON.stringify(TsIndividual),
      );
      const after = await stubLoadConfig(t, 'after://config/');

      const diff = configTileSetDiff(before, after);
      await dumpState(t.fullName, diff);
      const diffAll = diff.raster.find((m) => m.id === 'ts_all') as DiffTileSetRasterUpdated;
      const diffAerial = diff.raster.find((m) => m.id === 'ts_aerial') as DiffTileSetRasterUpdated;
      const diffLayer = diff.raster.find((m) => m.id === TsIndividual.id) as DiffTileSetRasterUpdated;
      assert.equal(diffAerial, undefined); // No changes to aerial layer
      assert.equal(diffLayer.type, 'new');
      assert.deepEqual(
        diffAll.layers.map((m) => [m.type, m.id].join(':')),
        ['new:top-of-the-south-flood-2022-0.15m'],
      );
    });

    it('should show a diff when a individual layer is removed', async (t) => {
      await fsa.write(
        fsa.toUrl('before://config/tileset/' + TsIndividual.layers[0].name + '.json'),
        JSON.stringify(TsIndividual),
      );
      const before = await stubLoadConfig(t, 'before://config/');
      const after = await stubLoadConfig(t, 'after://config/');

      const diff = configTileSetDiff(before, after);
      await dumpState(t.fullName, diff);

      const diffAll = diff.raster.find((m) => m.id === 'ts_all') as DiffTileSetRasterUpdated;
      const diffAerial = diff.raster.find((m) => m.id === 'ts_aerial') as DiffTileSetRasterUpdated;
      const diffLayer = diff.raster.find((m) => m.id === TsIndividual.id) as DiffTileSetRasterUpdated;
      assert.equal(diffAerial, undefined); // No changes to aerial layer
      assert.equal(diffLayer.type, 'removed');
      assert.deepEqual(
        diffAll.layers.map((m) => [m.type, m.id].join(':')),
        ['removed:top-of-the-south-flood-2022-0.15m'],
      );
    });
  });

  describe('pipeline', () => {
    beforeEach(async () => {
      fsMem.files.clear();
      await fsa.write(fsa.toUrl('before://config/tileset/aerial.json'), aerialJson);
      await fsa.write(fsa.toUrl('after://config/tileset/aerial.json'), aerialJson);
    });

    it('should show creation for raster pipelines', async (t) => {
      const before = await stubLoadConfig(t, 'before://config/');
      await fsa.write(fsa.toUrl('after://config/tileset/elevation.json'), JSON.stringify(TsElevation));
      const after = await stubLoadConfig(t, 'after://config/');

      const diff = configTileSetDiff(before, after);

      const allDiff = diff.raster.find((f) => f.id === 'ts_all') as DiffTileSetRasterUpdated;

      // Three new layers added to the all layer
      assert.equal(allDiff?.type, 'updated');
      assert.deepEqual(
        allDiff.layers.map((m) => `${m.type}:${m.id}`),
        ['new:manawatu-whanganui-2015-2016-dem-1m', 'new:new-zealand-2012-dem-8m', 'new:wellington-2013-2014-dem-1m'],
      );

      const elevationDiff = diff.raster.find((f) => f.id === 'ts_elevation') as DiffNew<ConfigTileSetRaster>;
      assert.equal(elevationDiff.type, 'new');
      await dumpState(t.fullName, diff);
    });

    it('should show diffs when a pipeline output is removed', async (t) => {
      await fsa.write(fsa.toUrl('before://config/tileset/elevation.json'), JSON.stringify(TsElevation));
      const before = await stubLoadConfig(t, 'before://config/');

      const newElevation = structuredClone(TsElevation);
      newElevation.outputs?.pop();
      // await fsa.write(fsa.toUrl('after://config/tileset/aerial.json'), aerialJson);
      await fsa.write(fsa.toUrl('after://config/tileset/elevation.json'), JSON.stringify(newElevation));
      const after = await stubLoadConfig(t, 'after://config/');

      const diff = configTileSetDiff(before, after);

      assert.equal(diff.raster.length, 1);
      assert.equal(diff.raster[0].id, 'ts_elevation');
      assert.equal(diff.raster[0].type, 'updated');

      const rasterDiff = diff.raster[0] as DiffTileSetRasterUpdated;
      assert.equal(rasterDiff.layers.length, 0); // No layers changed
      // One change to the outputs
      assert.deepEqual(
        rasterDiff.changes.map((m) => m.path?.join('.')),
        ['outputs'],
      );
      await dumpState(t.fullName, diff);
    });

    it('should show diffs for when output format changes', async (t) => {
      await fsa.write(fsa.toUrl('before://config/tileset/elevation.json'), JSON.stringify(TsElevation));
      const before = await stubLoadConfig(t, 'before://config/');

      // Changing output format to webp
      const newElevation = structuredClone(TsElevation);
      newElevation.outputs![0].format = ['webp'];
      // await fsa.write(fsa.toUrl('after://config/tileset/aerial.json'), aerialJson);
      await fsa.write(fsa.toUrl('after://config/tileset/elevation.json'), JSON.stringify(newElevation));
      const after = await stubLoadConfig(t, 'after://config/');

      const diff = configTileSetDiff(before, after);

      await dumpState(t.fullName, diff);
    });
  });
});

function fakeLayerConfig(name: string, title: string): ConfigLayer {
  return {
    '2193': `source://linz-basemaps/2193/${name}/${sha256base58(name + '2193')}/`,
    '3857': `source://linz-basemaps/3857/${name}/${sha256base58(name + '3857')}/`,
    name,
    title,
    category: 'Urban Aerial Photos',
    minZoom: 14,
  };
}

function fakeLayerConfigFile(removed: TileSetConfigSchemaLayer): TileSetConfigSchema {
  return {
    type: 'raster',
    id: `ts_${removed.name}`,
    name: removed.name,
    title: removed.title,
    category: removed.category,
    layers: [{ ...removed, minZoom: 0, maxZoom: 32, category: undefined }],
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  } as TileSetConfigSchema;
}
