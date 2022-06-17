import { Config, ConfigLayer, ConfigTileSet, ConfigTileSetRaster, TileSetType } from '@basemaps/config';
import { ImageFormat, VectorFormat } from '@basemaps/geo';
import { Updater } from '../base.config.js';

export class TileSetUpdater extends Updater<ConfigTileSet> {
  db = Config.TileSet;

  prepareNewData(oldData: ConfigTileSet | null): ConfigTileSet {
    const now = Date.now();

    const layers: ConfigLayer[] = [];

    const tileSet: Partial<ConfigTileSet> = {
      type: this.config.type,
      id: this.getId(),
      name: Config.unprefix(Config.TileSet.prefix, this.config.id),
      layers,
      createdAt: oldData ? oldData.createdAt : now,
      updatedAt: now,
    };

    // Map the configuration sources into imagery ids
    for (const l of this.config.layers) {
      const layer = { ...l };
      layers.push(layer);

      if (tileSet.type === TileSetType.Raster) {
        if (layer[2193]) layer[2193] = layer[2193];
        if (layer[3857]) layer[3857] = layer[3857];
      }
    }

    if (this.config.title) tileSet.title = this.config.title;
    if (this.config.description) tileSet.description = this.config.description;
    if (this.config.minZoom) tileSet.minZoom = this.config.minZoom;
    if (this.config.maxZoom) tileSet.maxZoom = this.config.maxZoom;
    if (tileSet.type === TileSetType.Raster && (this.config as ConfigTileSetRaster).background)
      tileSet.background = (this.config as ConfigTileSetRaster).background;

    if (this.config.format) {
      tileSet.format = this.config.format as ImageFormat | VectorFormat;
    } else {
      tileSet.format = tileSet.type === TileSetType.Vector ? VectorFormat.MapboxVectorTiles : ImageFormat.Webp;
    }

    return tileSet as ConfigTileSet;
  }

  invalidatePath(): string {
    return `/v1/tiles/${this.getId().slice(3)}/*`;
  }
}
