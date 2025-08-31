import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import timers from 'node:timers/promises';

import { ulid } from 'ulid';

import { ConfigBase } from '../../config/base.js';
import { ConfigImagery } from '../../config/imagery.js';
import { ConfigTileSetRaster } from '../../config/tile.set.js';
import { ConfigProviderMemory } from '../memory.config.js';

describe('MemoryConfig', () => {
  const config = new ConfigProviderMemory();
  beforeEach(() => config.objects.clear());
  const id = ulid();
  const imId = `im_${id}`;
  const tsId = `ts_${id}`;

  const baseImg = { id: imId, name: 'ōtorohanga_urban_2021_0-1m_RGB', projection: 3857 } as ConfigImagery;
  const baseTs = { id: tsId, description: 'tileset' } as ConfigTileSetRaster;

  it('should load correct objects from memory', async () => {
    config.put(baseTs);
    config.put(baseImg);

    const img = await config.Imagery.get(imId);
    assert.equal(img?.id, imId);

    const ts = await config.TileSet.get(tsId);
    assert.equal(ts?.id, tsId);
    assert.equal(ts?.description, 'tileset');
  });

  it('should support prefixed keys', async () => {
    config.put(baseImg);

    const img = await config.Imagery.get(imId);
    assert.equal(img?.id, imId);
  });

  it('should not find objects', async () => {
    const res = await Promise.all([
      config.Imagery.get('123'),
      config.TileSet.get('123'),
      config.Provider.get('123'),
      config.Style.get('123'),
    ]);

    assert.deepEqual(res, [null, null, null, null]);
  });

  it('should searialize to json', () => {
    config.put(baseTs);
    config.put(baseImg);

    const json = config.toJson();

    assert.equal(json.imagery.length, 1);
    assert.equal(json.imagery[0].id, baseImg.id);

    assert.equal(json.tileSet.length, 1);
    assert.equal(json.tileSet[0].id, baseTs.id);

    assert.equal(json.style.length, 0);
    assert.equal(json.provider.length, 0);
  });

  it('should generate virtual tilesets', () => {
    config.put(baseImg);
    assert.equal(config.toJson().tileSet.length, 0);

    config.createVirtualTileSets();

    const cfg = config.toJson();
    assert.equal(cfg.tileSet.length, 3);
    assert.equal(cfg.tileSet[0].id, tsId);
    assert.equal(cfg.tileSet[1].id, 'ts_ōtorohanga-urban-2021-0.1m');
    assert.equal(cfg.tileSet[2].id, 'ts_all');
    const allTileSet = cfg.tileSet[2];
    assert.equal(allTileSet.layers.length, 1);
    assert.equal(allTileSet.layers[0].name, 'ōtorohanga-urban-2021-0.1m');
  });

  const newId = ulid();
  const newImId = `im_${newId}`;
  it('should create virtual tilesets by name', async () => {
    config.put(baseImg);
    config.put({ ...baseImg, projection: 2193, id: newImId } as ConfigImagery);
    assert.equal(config.toJson().tileSet.length, 0);

    config.createVirtualTileSets();

    const target = await config.TileSet.get('ōtorohanga-urban-2021-0.1m');
    assert.equal(target?.layers.length, 1);
    assert.equal(target?.layers[0][3857], baseImg.id);
    assert.equal(target?.layers[0][2193], newImId);
    assert.equal(target?.name, 'ōtorohanga-urban-2021-0.1m');
  });

  it('virtual tilesets can be called multiple times', () => {
    config.put(baseImg);
    config.put({ ...baseImg, projection: 2193, id: newImId } as ConfigImagery);

    config.createVirtualTileSets();
    config.createVirtualTileSets();
    config.createVirtualTileSets();

    const cfg = config.toJson();
    // 1 tileset per imagery id (2x)
    // 1 tileset per imagery name (1x)
    assert.equal(cfg.tileSet.length, 4);
    assert.equal(cfg.tileSet[0].id, tsId);
    assert.equal(cfg.tileSet[1].id, 'ts_ōtorohanga-urban-2021-0.1m');
    assert.equal(cfg.tileSet[2].id, `ts_${newId}`);
    assert.equal(cfg.tileSet[3].id, 'ts_all');
    assert.equal(cfg.tileSet[3].layers.length, 1);
    assert.equal(cfg.tileSet[3].layers[0][2193], newImId);
    assert.equal(cfg.tileSet[3].layers[0][3857], imId);
    assert.equal(cfg.tileSet[3].layers[0].maxZoom, undefined);
    assert.equal(cfg.tileSet[3].layers[0].minZoom, 32);
  });

  it('virtual tilesets should overwrite existing projections', async () => {
    config.put(baseImg);
    config.put({ ...baseImg, id: newImId } as ConfigImagery);

    assert.equal(config.toJson().tileSet.length, 0);

    config.createVirtualTileSets();

    const target = await config.TileSet.get('ts_ōtorohanga-urban-2021-0.1m');
    assert.equal(target?.layers.length, 1);
    assert.equal(target?.layers[0][3857], newImId);
    assert.equal(target?.layers[0][2193], undefined);
    assert.equal(target?.name, 'ōtorohanga-urban-2021-0.1m');
  });

  it('virtual tilesets should be created with `:`', async () => {
    const idA = ulid();
    const idB = ulid();
    config.objects.clear();
    config.put({
      ...baseTs,
      name: 'aerial',
      id: 'ts_aerial',
      layers: [
        {
          name: baseImg.name,
          title: '',
          category: '',
          2193: `im_${idA}`,
          3857: `im_${idB}`,
        },
      ],
    } as ConfigBase);
    config.put({ ...baseImg, id: `im_${idA}`, projection: 2193 } as ConfigImagery);
    config.put({ ...baseImg, id: `im_${idB}`, projection: 3857 } as ConfigImagery);

    assert.equal(config.toJson().tileSet.length, 1);
    config.createVirtualTileSets();

    const tileSets = config.toJson().tileSet.map((c) => c.id);

    assert.deepEqual(tileSets, [
      'ts_aerial',
      `ts_${idA}`, // By image id
      'ts_ōtorohanga-urban-2021-0.1m', // By name
      `ts_${idB}`, // By image id
      'ts_all',
    ]);

    const target = await config.TileSet.get('ts_ōtorohanga-urban-2021-0.1m');
    assert.equal(target?.layers.length, 1);
    assert.equal(target?.layers[0][3857], `im_${idB}`);
    assert.equal(target?.layers[0][2193], `im_${idA}`);
    // the name should be mapped back to the expected name so tiles will be served via the same endpoints as by name
    assert.equal(target?.name, 'ōtorohanga-urban-2021-0.1m');
  });

  it('The latest imagery should overwrite the old ones', async () => {
    const idLater = ulid();
    await timers.setTimeout(5);
    const idLatest = ulid();
    config.put(baseImg);
    config.put({ ...baseImg, id: `im_${idLater}` } as ConfigImagery);
    config.put({ ...baseImg, id: `im_${idLatest}` } as ConfigImagery);

    assert.equal(config.toJson().imagery.length, 3);

    config.createVirtualTileSets();
    const target = await config.TileSet.get('ts_ōtorohanga-urban-2021-0.1m');
    assert.equal(target?.layers.length, 1);
    assert.equal(target?.layers[0][3857], `im_${idLatest}`);
    assert.equal(target?.layers[0][2193], undefined);
    assert.equal(target?.name, 'ōtorohanga-urban-2021-0.1m');
  });

  it('virtual tileset aliases', async () => {
    config.put({ ...baseTs, aliases: ['someAlias'] } as ConfigTileSetRaster);
    config.createVirtualTileSets();
    const ts = await config.TileSet.get('ts_someAlias');
    assert.equal(ts?.id, 'ts_someAlias');
  });
});
