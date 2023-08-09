import o from 'ospec';
import { BaseConfig } from '../../config/base.js';
import { ConfigImagery } from '../../config/imagery.js';
import { ConfigTileSetRaster } from '../../config/tile.set.js';
import { ConfigProviderMemory } from '../memory.config.js';
import { ulid } from 'ulid';

o.spec('MemoryConfig', () => {
  const config = new ConfigProviderMemory();
  o.beforeEach(() => config.objects.clear());
  const id = ulid();
  const imId = `im_${id}`;
  const tsId = `ts_${id}`;

  const baseImg = { id: imId, name: 'ōtorohanga_urban_2021_0-1m_RGB', projection: 3857 } as ConfigImagery;
  const baseTs = { id: tsId, description: 'tileset' } as ConfigTileSetRaster;

  o('should load correct objects from memory', async () => {
    config.put(baseTs);
    config.put(baseImg);

    const img = await config.Imagery.get(imId);
    o(img?.id).equals(imId);

    const ts = await config.TileSet.get(tsId);
    o(ts?.id).equals(tsId);
    o(ts?.description).equals('tileset');
  });

  o('should support prefixed keys', async () => {
    config.put(baseImg);

    const img = await config.Imagery.get(imId);
    o(img?.id).equals(imId);
  });

  o('should not find objects', async () => {
    const res = await Promise.all([
      config.Imagery.get('123'),
      config.TileSet.get('123'),
      config.Provider.get('123'),
      config.Style.get('123'),
    ]);

    o(res).deepEquals([null, null, null, null]);
  });

  o('should searialize to json', async () => {
    config.put(baseTs);
    config.put(baseImg);

    const json = await config.toJson();

    o(json.imagery.length).equals(1);
    o(json.imagery[0].id).equals(baseImg.id);

    o(json.tileSet.length).equals(1);
    o(json.tileSet[0].id).equals(baseTs.id);

    o(json.style.length).equals(0);
    o(json.provider.length).equals(0);
  });

  o('should generate virtual tilesets', async () => {
    config.put(baseImg);
    o(config.toJson().tileSet.length).equals(0);

    config.createVirtualTileSets();

    const cfg = config.toJson();
    o(cfg.tileSet.length).equals(3);
    o(cfg.tileSet[0].id).equals(tsId);
    o(cfg.tileSet[1].id).equals('ts_ōtorohanga-urban-2021-0.1m');
    o(cfg.tileSet[2].id).equals('ts_all');
    const allTileSet = cfg.tileSet[2];
    o(allTileSet.layers.length).equals(1);
    o(allTileSet.layers[0].name).equals('ōtorohanga-urban-2021-0.1m');
  });

  const newId = ulid();
  const newImId = `im_${newId}`;
  o('should create virtual tilesets by name', async () => {
    config.put(baseImg);
    config.put({ ...baseImg, projection: 2193, id: newImId } as ConfigImagery);
    o(config.toJson().tileSet.length).equals(0);

    config.createVirtualTileSets();

    const target = await config.TileSet.get('ōtorohanga-urban-2021-0.1m');
    o(target?.layers.length).equals(1);
    o(target?.layers[0][3857]).equals(baseImg.id);
    o(target?.layers[0][2193]).equals(newImId);
    o(target?.name).equals('ōtorohanga-urban-2021-0.1m');
  });

  o('virtual tilesets can be called multiple times', () => {
    config.put(baseImg);
    config.put({ ...baseImg, projection: 2193, id: newImId } as ConfigImagery);

    config.createVirtualTileSets();
    config.createVirtualTileSets();
    config.createVirtualTileSets();

    const cfg = config.toJson();
    // 1 tileset per imagery id (2x)
    // 1 tileset per imagery name (1x)
    o(cfg.tileSet.length).equals(4);
    o(cfg.tileSet[0].id).equals(tsId);
    o(cfg.tileSet[1].id).equals('ts_ōtorohanga-urban-2021-0.1m');
    o(cfg.tileSet[2].id).equals(`ts_${newId}`);
    o(cfg.tileSet[3].id).equals('ts_all');
    o(cfg.tileSet[3].layers.length).equals(1);
    o(cfg.tileSet[3].layers[0][2193]).equals(newImId);
    o(cfg.tileSet[3].layers[0][3857]).equals(imId);
    o(cfg.tileSet[3].layers[0].maxZoom).equals(undefined);
    o(cfg.tileSet[3].layers[0].minZoom).equals(32);
  });

  o('virtual tilesets should overwrite existing projections', async () => {
    config.put(baseImg);
    config.put({ ...baseImg, id: newImId } as ConfigImagery);

    o(config.toJson().tileSet.length).equals(0);

    config.createVirtualTileSets();

    const target = await config.TileSet.get('ts_ōtorohanga-urban-2021-0.1m');
    o(target?.layers.length).equals(1);
    o(target?.layers[0][3857]).equals(newImId);
    o(target?.layers[0][2193]).equals(undefined);
    o(target?.name).equals('ōtorohanga-urban-2021-0.1m');
  });

  o('virtual tilesets should be created with `:`', async () => {
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
    } as BaseConfig);
    config.put({ ...baseImg, id: `im_${idA}`, projection: 2193 } as ConfigImagery);
    config.put({ ...baseImg, id: `im_${idB}`, projection: 3857 } as ConfigImagery);

    o(config.toJson().tileSet.length).equals(1);
    config.createVirtualTileSets();

    const tileSets = config.toJson().tileSet.map((c) => c.id);

    o(tileSets).deepEquals([
      'ts_aerial',
      'ts_aerial:ōtorohanga_urban_2021_0-1m_RGB', // deprecated by child `:`
      `ts_${idA}`, // By image id
      'ts_ōtorohanga-urban-2021-0.1m', // By name
      `ts_${idB}`, // By image id
      'ts_all',
    ]);

    const target = await config.TileSet.get('ts_aerial:ōtorohanga_urban_2021_0-1m_RGB');
    o(target?.layers.length).equals(1);
    o(target?.layers[0][3857]).equals(`im_${idB}`);
    o(target?.layers[0][2193]).equals(`im_${idA}`);
    // the name should be mapped back to the expected name so tiles will be served via the same endpoints as by name
    o(target?.name).equals('ōtorohanga-urban-2021-0.1m');
  });

  o('The latest imagery should overwrite the old ones', async () => {
    const idLater = ulid();
    await new Promise((resolve) => setTimeout(resolve, 5));
    const idLatest = ulid();
    config.put(baseImg);
    config.put({ ...baseImg, id: `im_${idLater}` } as ConfigImagery);
    config.put({ ...baseImg, id: `im_${idLatest}` } as ConfigImagery);

    o(config.toJson().imagery.length).equals(3);

    config.createVirtualTileSets();
    const target = await config.TileSet.get('ts_ōtorohanga-urban-2021-0.1m');
    o(target?.layers.length).equals(1);
    o(target?.layers[0][3857]).equals(`im_${idLatest}`);
    o(target?.layers[0][2193]).equals(undefined);
    o(target?.name).equals('ōtorohanga-urban-2021-0.1m');
  });
});
