import { WindowUrl } from './url.js';
import { ConfigTileSetRaster } from '@basemaps/config/build/config/tile.set.js';
import { ConfigImagery } from '@basemaps/config/build/config/imagery.js';

export class ConfigData {
  static tileSets = new Map<string, Promise<ConfigTileSetRaster | null>>();
  static imagery = new Map<string, Promise<ConfigImagery | null>>();

  static getTileSet(tileSetId: string): Promise<ConfigTileSetRaster | null> {
    const tileSetUrl = WindowUrl.toConfigUrl(tileSetId);
    console.log('getTileSet', tileSetUrl);
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
    console.log('getImagery', imageryUrl);
    let existing = this.imagery.get(imageryUrl);
    if (existing) return existing;

    existing = fetch(imageryUrl).then((res) => {
      if (res.ok) return res.json();
      return null;
    });
    this.imagery.set(imageryUrl, existing);
    return existing;
  }
}
