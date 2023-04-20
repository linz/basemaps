import { Tile } from './tile.matrix.set.js';

export const TileId = {
  /** Create a tile from a tile ID in the format `:z-:x-:y` */
  toTile(tileId: string): Tile {
    const parts = tileId.split('-');
    if (parts.length !== 3) throw new Error('Invalid TileId: ' + tileId);
    const tile: Tile = { z: Number(parts[0]), x: Number(parts[1]), y: Number(parts[2]) };
    if (isNaN(tile.x) || isNaN(tile.y) || isNaN(tile.z)) throw new Error('Tile is not a number: ' + tileId);
    return tile;
  },
  /** Create a tileID `:z-:x-:y */
  fromTile(tile: Tile): string {
    return `${tile.z}-${tile.x}-${tile.y}`;
  },
};
