import { Bounds, ImageFormat, TileMatrixSet } from '@basemaps/geo';
import { fsa } from '@chunkd/fs';
import { basename } from 'path';
import ulid from 'ulid';
import { ConfigImagery } from './config/imagery.js';
import { ConfigTileSet, TileSetType } from './config/tile.set.js';

function guessIdFromUri(uri: string): string {
  const parts = uri.split('/');
  const id = parts.pop();

  if (id == null) throw new Error('Could not get id from URI: ' + uri);
  const date = new Date(ulid.decodeTime(id));
  if (date.getUTCFullYear() < 2015) throw new Error('Could not get id from URI: ' + uri);
  if (date.getUTCFullYear() > new Date().getUTCFullYear() + 1) throw new Error('Could not get id from URI: ' + uri);
  return id;
}

export class ImageryConfigCache {
  cache: Map<string, Promise<ConfigImagery>> = new Map();

  toImageryConfig(uri: string, name: string, tms: TileMatrixSet): Promise<ConfigImagery> {
    let existing = this.cache.get(uri);
    if (existing == null) {
      existing = ImageryConfig.fetchImageryConfig(uri, name, tms);
      this.cache.set(uri, existing);
    }
    return existing;
  }
}

export class ImageryConfig {
  static async fetchImageryConfig(uri: string, name: string, tms: TileMatrixSet): Promise<ConfigImagery> {
    // TODO is there a better way of guessing the imagery id?
    const id = 'im_' + guessIdFromUri(uri);

    const fileList = await fsa.toArray(fsa.list(uri));
    const tiffFiles = fileList.filter((f) => f.endsWith('.tiff'));

    let bounds: Bounds | null = null;

    // Files are stored as `{z}-{x}-{y}.tiff`
    const files = tiffFiles.map((c) => {
      const tileName = basename(c).replace('.tiff', '');
      const [z, x, y] = tileName.split('-').map((f) => Number(f));
      if (z == null || y == null || z == null) throw new Error('Failed to parse XYZ from: ' + c);

      const tile = tms.tileToSourceBounds({ z, x, y });
      // Expand the total bounds to cover this tile
      if (bounds == null) bounds = Bounds.fromJson(tile);
      else bounds = bounds.union(Bounds.fromJson(tile));
      return { ...tile, name: tileName };
    });

    // Sort the files by Z, X, Y
    files.sort((a, b): number => {
      const widthSize = a.width - b.width;
      if (widthSize !== 0) return widthSize;

      const aXyz = a.name.split('-').map((f) => Number(f));
      const bXyz = b.name.split('-').map((f) => Number(f));

      const xDiff = aXyz[1] - bXyz[1];
      if (xDiff !== 0) return xDiff;

      return bXyz[2] - aXyz[2];
    });

    if (bounds == null) throw new Error('Failed to get bounds from URI: ' + uri);
    const now = Date.now();
    const output: ConfigImagery = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      projection: tms.projection.code,
      uri,
      bounds,
      files,
    };
    return output;
  }

  static toTileSet(id: string, i: ConfigImagery): ConfigTileSet {
    const now = Date.now();

    const tileSet: ConfigTileSet = {
      type: TileSetType.Raster,
      format: ImageFormat.Webp,
      id,
      name: i.name,
      layers: [{ [i.projection]: i.id, name: i.name, minZoom: 0, maxZoom: 32 }],
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      createdAt: i.createdAt ? i.createdAt : now,
      updatedAt: now,
    };
    return tileSet;
  }
}
