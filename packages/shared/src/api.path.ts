import { Epsg, Tile, TileMatrixSets, TileMatrixSet, ImageFormat, VectorFormat } from '@basemaps/geo';
import { getImageFormat } from '@basemaps/tiler';

export interface ActionData {
  version: string;
  action: string;
  rest: string[];
  urlPath: string;
}

export enum TileType {
  WMTS = 'WMTS',
  Tile = 'tile',
  Attribution = 'attribution',
}

export type TileData = TileDataXyz | TileDataWmts | TileDataAttribution;

interface NameTileMatrix {
  name: string;
  tileMatrix: TileMatrixSet;
}

export interface TileDataXyz extends Tile, NameTileMatrix {
  type: TileType.Tile;
  ext: ImageFormat | VectorFormat;
}

export interface TileDataWmts {
  type: TileType.WMTS;
  name: string;
  tileMatrix: TileMatrixSet | null;
}

export interface TileDataAttribution extends NameTileMatrix {
  type: TileType.Attribution;
}

export function setNameAndProjection(req: { set: (key: string, val: any) => void }, data: TileData): void {
  req.set('tileSet', data.name);
  if (data.tileMatrix == null) return;
  req.set('projection', data.tileMatrix.projection);
}

export function extractTileMatrixSet(text: string): TileMatrixSet | null {
  const projection = Epsg.parse(text);
  if (projection != null) return TileMatrixSets.tryGet(projection.code) ?? null;
  return TileMatrixSets.find(text);
}

export function tileXyzFromPath(path: string[]): TileDataXyz | null {
  if (path.length < 5) return null;
  const name = path[0];
  const tileMatrix = extractTileMatrixSet(path[1]);
  if (tileMatrix == null) return null;
  const z = parseInt(path[2], 10);
  const x = parseInt(path[3], 10);
  const [ystr, extStr] = path[4].split('.', 2);
  const y = parseInt(ystr, 10);

  if (isNaN(x) || isNaN(y) || isNaN(z)) return null;

  if (extStr === 'pbf') {
    return { type: TileType.Tile, name, tileMatrix, x, y, z, ext: VectorFormat.MapboxVectorTiles };
  }

  const ext = getImageFormat(extStr);
  if (ext == null) return null;

  return { type: TileType.Tile, name, tileMatrix, x, y, z, ext };
}

export function tileAttributionFromPath(path: string[]): TileDataAttribution | null {
  if (path.length < 3) return null;

  const name = path[0];
  const tileMatrix = extractTileMatrixSet(path[1]);
  if (tileMatrix == null) return null;

  return { type: TileType.Attribution, name, tileMatrix };
}

/**
 * Extract WMTS information from a path
 *
 * @example
 * - /v1/aerial/2193/WMTSCapabilities
 * - /v1/aerial/WMTSCapabilities
 * @param path
 * @param tileSet
 */
export function tileWmtsFromPath(path: string[]): TileDataWmts | null {
  if (path.length > 3) return null;

  const name = path.length < 2 ? '' : path[0];
  if (path.length === 3) {
    const tileMatrix = extractTileMatrixSet(path[1]);
    if (tileMatrix == null) return null;
    return { type: TileType.WMTS, name, tileMatrix };
  }

  return { type: TileType.WMTS, name, tileMatrix: null };
}

/**
 * Extract tile variables (`tileSet`, `projection`, `x`, `y`, `z` and `ext`) from an array
 **/
export function tileFromPath(path: string[]): TileData | null {
  if (path.length < 1) return null;
  const fileName = path[path.length - 1].toLowerCase();
  if (fileName === 'wmtscapabilities.xml') return tileWmtsFromPath(path);
  if (fileName === 'attribution.json') return tileAttributionFromPath(path);
  return tileXyzFromPath(path);
}
