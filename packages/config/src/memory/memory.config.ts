import { BasemapsConfig, BasemapsConfigObject } from '../base.config';
import { BaseConfig } from '../config/base';
import { ConfigImagery } from '../config/imagery';
import { ConfigPrefix } from '../config/prefix';
import { ConfigProvider } from '../config/provider';
import { ConfigTileSet } from '../config/tile.set';
import { ConfigVectorStyle } from '../config/vector.style';

export class MemoryConfig extends BasemapsConfig {
    Imagery = new MemoryConfigObject<ConfigImagery>(this, ConfigPrefix.Imagery);
    Style = new MemoryConfigObject<ConfigVectorStyle>(this, ConfigPrefix.Style);
    TileSet = new MemoryConfigObject<ConfigTileSet>(this, ConfigPrefix.TileSet);
    Provider = new MemoryConfigObject<ConfigProvider>(this, ConfigPrefix.Provider);

    /** Memory cache of all objects */
    objects = new Map<string, BaseConfig>();

    put(obj: BaseConfig): void {
        this.objects.set(obj.id, obj);
    }
}

export class MemoryConfigObject<T extends BaseConfig> extends BasemapsConfigObject<T> {
    prefix: ConfigPrefix;
    cfg: MemoryConfig;

    constructor(cfg: MemoryConfig, prefix: ConfigPrefix) {
        super(prefix);
        this.cfg = cfg;
    }

    async get(id: string): Promise<T | null> {
        const obj = this.cfg.objects.get(this.id(id));
        if (this.is(obj)) return obj;
        return null;
    }

    async getAll(ids: Set<string>): Promise<Map<string, T>> {
        const map = new Map<string, T>();
        for (const id of ids) {
            const obj = await this.get(id);
            if (obj == null) continue;
            map.set(id, obj);
        }
        return map;
    }
}
