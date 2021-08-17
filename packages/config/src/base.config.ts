import { Epsg, EpsgCode } from '@basemaps/geo';
import { ConfigImagery, ConfigProvider, ConfigTileSetRaster, ConfigTileSetVector, ConfigVectorStyle } from '.';
import { ConfigLayer, ConfigTileSet, TileSetType } from './config/tile.set';
import { BasemapsConfigObject } from './instance';

export abstract class BasemapsConfigInstance {
    abstract TileSet: BasemapsConfigObject<ConfigTileSet>;
    abstract Imagery: BasemapsConfigObject<ConfigImagery>;
    abstract Style: BasemapsConfigObject<ConfigVectorStyle>;
    abstract Provider: BasemapsConfigObject<ConfigProvider>;

    isTileSetRaster(s: ConfigTileSet | null): s is ConfigTileSetRaster {
        if (s == null) return false;
        return s.type == null || s.type === TileSetType.Raster;
    }

    isTileSetVector(s: ConfigTileSet | null): s is ConfigTileSetVector {
        if (s == null) return false;
        return s.type === TileSetType.Vector;
    }

    async getImagery(layer: ConfigLayer, projection: Epsg): Promise<ConfigImagery | null> {
        if (projection.code === EpsgCode.Nztm2000 && layer[2193]) return this.Imagery.get(this.Imagery.id(layer[2193]));
        if (projection.code === EpsgCode.Google && layer[3857]) return this.Imagery.get(this.Imagery.id(layer[3857]));
        return null;
    }

    async getAllImagery(layers: ConfigLayer[], projection: Epsg): Promise<Map<string, ConfigImagery>> {
        const toFetch = new Set<string>();
        // Get Imagery based on the order of rules. Imagery priority are ordered by on rules.
        for (const layer of layers) {
            const imgId = layer[projection.code];
            if (imgId == null) continue;
            toFetch.add(this.Imagery.id(imgId));
        }

        return this.Imagery.getAll(toFetch);
    }

    /** Get all imagery for a tile set */
    getTileSetImagery(rec: ConfigTileSetRaster): Promise<Map<string, ConfigImagery>> {
        const imgIds = new Set<string>();
        for (const layer of rec.layers) {
            if (layer[2193] != null) imgIds.add(layer[2193]);
            if (layer[3857] != null) imgIds.add(layer[3857]);
        }
        return this.Imagery.getAll(imgIds);
    }

    /** Get the imageId from a layer for a specific projection */
    getImageId(layer: ConfigLayer, projection: Epsg): string | undefined {
        return layer[projection.code];
    }
}
