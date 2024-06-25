import { ConfigImagery } from '@basemaps/config/build/config/imagery.js';
import { ConfigTileSetRaster } from '@basemaps/config/build/config/tile.set.js';
import { TileMatrixSets } from '@basemaps/geo';
import { Projection } from '@basemaps/geo';
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

  static getGeoJson(imagery: ConfigImagery): BBoxFeatureCollection | undefined {
    const tileMatrix = TileMatrixSets.find(imagery.tileMatrix);
    if (tileMatrix == null) return;
    const gj = Projection.get(tileMatrix).toGeoJson(imagery.files);

    // Improve the GeoJSON with some attributes that are useful
    for (const f of gj.features) {
      f.properties = f.properties ?? {};
      const fileName = f.properties['name'] as string;
      f.properties['location'] = new URL(fileName, imagery.uri).href;
      f.properties['epsg'] = imagery.projection;
      f.properties['tileMatrix'] = imagery.tileMatrix;
      const source = imagery.files.find((f) => f.name === fileName);
      if (source != null) {
        f.properties['x'] = source.x;
        f.properties['y'] = source.y;
        f.properties['width'] = source.width;
        f.properties['height'] = source.height;
      }
    }

    return gj;
  }
}
