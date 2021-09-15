import o from 'ospec';
import { ConfigImagery } from '../../config/imagery.js';
import { ConfigTileSet } from '../../config/tile.set.js';
import { ConfigProviderMemory } from '../memory.config.js';

o.spec('MemoryConfig', () => {
    const config = new ConfigProviderMemory();
    o.beforeEach(() => config.objects.clear());

    const baseImg = { id: 'im_123' } as ConfigImagery;
    const baseTs = { id: 'ts_123', description: 'tileset' } as ConfigTileSet;

    o('should load correct objects from memory', async () => {
        config.put(baseTs);
        config.put(baseImg);

        const img = await config.Imagery.get('123');
        o(img?.id).equals('im_123');

        const ts = await config.TileSet.get('123');
        o(ts?.id).equals('ts_123');
        o(ts?.description).equals('tileset');
    });

    o('should support prefixed keys', async () => {
        config.put(baseImg);

        const img = await config.Imagery.get('im_123');
        o(img?.id).equals('im_123');
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
});
