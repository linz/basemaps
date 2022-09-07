import { ConfigImagery } from '@basemaps/config/src/config/imagery.js';
import { ConfigTileSetRaster } from '@basemaps/config/src/config/tile.set.js';
import { TileMatrixSets } from '@basemaps/geo';
import { Projection } from '@basemaps/shared/src/proj/projection.js';

import { BBoxFeatureCollection } from '@linzjs/geojson';
import { WindowUrl } from './url.js';

export class ConfigData {
  static tileSets = new Map<string, Promise<ConfigTileSetRaster | null>>();
  static imagery = new Map<string, Promise<ConfigImagery | null>>();
  static config: string;

  static getTileSet(tileSetId: string): Promise<ConfigTileSetRaster | null> {
    const tileSetUrl = WindowUrl.toConfigUrl(tileSetId);

    let existing = this.tileSets.get(tileSetUrl);
    if (existing) return existing;

    existing = fetch(tileSetUrl).then((res) => {
      if (res.ok) return res.json();
      return null;
    });
    this.tileSets.set(tileSetUrl, existing);
    return existing;
  }

  static getImagery(tileSetId: string, imageryId: string): Promise<ConfigImagery | null> {
    const imageryUrl = WindowUrl.toConfigImageryUrl(tileSetId, imageryId);
    let existing = this.imagery.get(imageryUrl);
    if (existing) return existing;

    existing = fetch(imageryUrl).then((res) => {
      if (res.ok) return res.json();
      return null;
    });
    this.imagery.set(imageryUrl, existing);
    return existing;
  }

  static getGeoJson(imagery: ConfigImagery): BBoxFeatureCollection | null {
    const tileMatrix = TileMatrixSets.find(imagery.tileMatrix);
    if (tileMatrix == null) return null;
    return Projection.get(tileMatrix).toGeoJson(imagery.files);
  }
}
