import o from 'ospec';
import { BaseConfig } from '../../config/base.js';
import { ConfigImagery } from '../../config/imagery.js';
import { ConfigTileSetRaster } from '../../config/tile.set.js';
import { ConfigProviderMemory } from '../memory.config.js';

o.spec('MemoryConfig', () => {
  const config = new ConfigProviderMemory();
  o.beforeEach(() => config.objects.clear());

  const baseImg = { id: 'im_Image123', name: 'ōtorohanga_urban_2021_0-1m_RGB', projection: 3857 } as ConfigImagery;
  const baseTs = { id: 'ts_TileSet123', description: 'tileset' } as ConfigTileSetRaster;

  o('should load correct objects from memory', async () => {
    config.put(baseTs);
    config.put(baseImg);

    const img = await config.Imagery.get('Image123');
    o(img?.id).equals('im_Image123');

    const ts = await config.TileSet.get('TileSet123');
    o(ts?.id).equals('ts_TileSet123');
    o(ts?.description).equals('tileset');
  });

  o('should support prefixed keys', async () => {
    config.put(baseImg);

    const img = await config.Imagery.get('im_Image123');
    o(img?.id).equals('im_Image123');
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
    o(cfg.tileSet[0].id).equals('ts_Image123');
    o(cfg.tileSet[1].id).equals('ts_ōtorohanga-urban-2021-0.1m');
    o(cfg.tileSet[2].id).equals('ts_all');
    const allTileSet = cfg.tileSet[2];
    o(allTileSet.layers.length).equals(1);
    o(allTileSet.layers[0].name).equals('ōtorohanga-urban-2021-0.1m');
  });

  o('should create virtual tilesets by name', async () => {
    config.put(baseImg);
    config.put({ ...baseImg, projection: 2193, id: 'im_Image234' } as ConfigImagery);
    o(config.toJson().tileSet.length).equals(0);

    config.createVirtualTileSets();

    const target = await config.TileSet.get('ōtorohanga-urban-2021-0.1m');
    o(target?.layers.length).equals(1);
    o(target?.layers[0][3857]).equals(baseImg.id);
    o(target?.layers[0][2193]).equals('im_Image234');
    o(target?.name).equals('ōtorohanga-urban-2021-0.1m');
  });

  o('virtual tilesets can be called multiple times', () => {
    config.put(baseImg);
    config.put({ ...baseImg, projection: 2193, id: 'im_Image234' } as ConfigImagery);

    config.createVirtualTileSets();
    config.createVirtualTileSets();
    config.createVirtualTileSets();

    const cfg = config.toJson();
    // 1 tileset per imagery id (2x)
    // 1 tileset per imagery name (1x)
    o(cfg.tileSet.length).equals(4);
    o(cfg.tileSet[0].id).equals('ts_Image123');
    o(cfg.tileSet[1].id).equals('ts_ōtorohanga-urban-2021-0.1m');
    o(cfg.tileSet[2].id).equals('ts_Image234');
    o(cfg.tileSet[3].id).equals('ts_all');
    o(cfg.tileSet[3].layers.length).equals(1);
    o(cfg.tileSet[3].layers[0][2193]).equals('im_Image234');
    o(cfg.tileSet[3].layers[0][3857]).equals('im_Image123');
    o(cfg.tileSet[3].layers[0].maxZoom).equals(undefined);
    o(cfg.tileSet[3].layers[0].minZoom).equals(32);
  });

  o('virtual tilesets should overwrite existing projections', async () => {
    config.put(baseImg);
    config.put({ ...baseImg, id: 'im_Image234' } as ConfigImagery);

    o(config.toJson().tileSet.length).equals(0);

    config.createVirtualTileSets();

    const target = await config.TileSet.get('ts_ōtorohanga-urban-2021-0.1m');
    o(target?.layers.length).equals(1);
    o(target?.layers[0][3857]).equals('im_Image234');
    o(target?.layers[0][2193]).equals(undefined);
    o(target?.name).equals('ōtorohanga-urban-2021-0.1m');
  });

  o('virtual tilesets should be created with `:`', async () => {
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
          2193: 'im_image-2193',
          3857: 'im_image-3857',
        },
      ],
    } as BaseConfig);
    config.put({ ...baseImg, id: 'im_image-2193', projection: 2193 } as ConfigImagery);
    config.put({ ...baseImg, id: 'im_image-3857', projection: 3857 } as ConfigImagery);

    o(config.toJson().tileSet.length).equals(1);
    config.createVirtualTileSets();

    const tileSets = config.toJson().tileSet.map((c) => c.id);

    o(tileSets).deepEquals([
      'ts_aerial',
      'ts_aerial:ōtorohanga_urban_2021_0-1m_RGB', // deprecated by child `:`
      'ts_image-2193', // By image id
      'ts_ōtorohanga-urban-2021-0.1m', // By name
      'ts_image-3857', // By image id
      'ts_all',
    ]);

    const target = await config.TileSet.get('ts_aerial:ōtorohanga_urban_2021_0-1m_RGB');
    o(target?.layers.length).equals(1);
    o(target?.layers[0][3857]).equals('im_image-3857');
    o(target?.layers[0][2193]).equals('im_image-2193');
    // the name should be mapped back to the expected name so tiles will be served via the same endpoints as by name
    o(target?.name).equals('ōtorohanga-urban-2021-0.1m');
  });
});
