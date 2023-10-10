import { NamedBounds } from '../../bounds.js';
import { EpsgCode } from '../../epsg.js';
import { QuadKey } from '../../quad.key.js';
import { Tile, TileMatrixSet } from '../../tile.matrix.set.js';
import { TileMatrixSets } from '../../tms/index.js';

export function qkToName(qk: string): string {
  return TileMatrixSet.tileToName(QuadKey.toTile(qk));
}

export function qkToNamedBounds(quadKeys: string[]): NamedBounds[] {
  const tms = TileMatrixSets.get(EpsgCode.Google);
  return quadKeys.map((qk) => ({ name: qkToName(qk), ...tms.tileToSourceBounds(QuadKey.toTile(qk)) }));
}

export function tileNamesToNamedBounds(tileNames: string[], tms = TileMatrixSets.get(EpsgCode.Google)): NamedBounds[] {
  return tileNames.map((name) => ({ name, ...tms.tileToSourceBounds(TileMatrixSet.nameToTile(name)) }));
}

export function genTileNames(
  topLeftTile: Tile,
  xTotal: number,
  yTotal = 1,
  tms = TileMatrixSets.get(EpsgCode.Google),
): NamedBounds[] {
  const bounds: NamedBounds[] = [];

  yTotal += topLeftTile.y;
  xTotal += topLeftTile.x;
  const tile = { ...topLeftTile };
  for (let y = topLeftTile.y; y < yTotal; ++y) {
    tile.y = y;
    for (let x = topLeftTile.x; x < xTotal; ++x) {
      tile.x = x;
      bounds.push({ name: TileMatrixSet.tileToName(tile), ...tms.tileToSourceBounds(tile) });
    }
  }

  return bounds;
}
