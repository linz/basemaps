import o from 'ospec';
import { ConfigImagery } from '../../config/imagery.js';
import { ConfigTileSet } from '../../config/tile.set.js';
import { ConfigProviderMemory } from '../memory.config.js';

o.spec('MemoryConfig', () => {
  const config = new ConfigProviderMemory();
  o.beforeEach(() => config.objects.clear());

  const baseImg = { id: 'im_Image123' } as ConfigImagery;
  const baseTs = { id: 'ts_TileSet123', description: 'tileset' } as ConfigTileSet;

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

  o.only('should searialize to json', async () => {
    config.put(baseTs);
    config.put(baseImg);

    const json = await config.toJson();
    console.log(json);

    o(json.imagery.length).equals(1);
    o(json.imagery[0].id).equals(baseImg.id);

    o(json.tileSet.length).equals(1);
    o(json.tileSet[0].id).equals(baseTs.id);

    o(json.style.length).equals(0);
    o(json.provider.length).equals(0);
  });

  o.only('should generate virtual tilesets', async () => {
    config.put(baseImg);
    o(config.toJson().tileSet.length).equals(0);

    config.createVirtualTileSets();

    const cfg = config.toJson();
    o(cfg.tileSet.length).equals(1);
    o(cfg.tileSet[0].id).equals('ts_Image123');
  });
});
