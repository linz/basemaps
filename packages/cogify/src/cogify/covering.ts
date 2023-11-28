import { Simplify, Tile, TileId, TileMatrixSet } from '@basemaps/geo';
import { LogType } from '@basemaps/shared';
import { Area, intersection, MultiPolygon } from '@linzjs/geojson';
import { Metrics } from '@linzjs/metrics';

import { CutlineOptimizer } from '../cutline.js';

/**
 * Tile offsets for surrounding tiles
 * In the order North, West, South, East
 */
const SurroundingTiles = [
  { x: 0, y: -1 }, // North
  { x: 1, y: 0 }, // West
  { x: 0, y: 1 }, // South
  { x: -1, y: 0 }, // East
];

export function addChildren(tile: Tile, todo: Tile[] = []): Tile[] {
  const childZ = tile.z + 1;
  const xOffset = tile.x * 2;
  const yOffset = tile.y * 2;
  todo.push({ z: childZ, x: xOffset, y: yOffset }); //top left
  todo.push({ z: childZ, x: xOffset + 1, y: yOffset }); // top right
  todo.push({ z: childZ, x: xOffset, y: yOffset + 1 }); // bottom left
  todo.push({ z: childZ, x: xOffset + 1, y: yOffset + 1 }); // bottom right
  return todo;
}

export function addSurrounding(tile: Tile, tileMatrix: TileMatrixSet, todo: Tile[] = [], seen?: Set<string>): Tile[] {
  // Zoom should not have surrounding tiles
  if (tile.z === 0) return [];
  for (const sr of SurroundingTiles) {
    // TODO this should loop around if it goes outside the bounds of the tile matrix eg crossing the antimeridian
    const nextTile = { z: tile.z, x: sr.x + tile.x, y: sr.y + tile.y };

    const tileZoom = tileMatrix.zooms[tile.z];
    if (nextTile.x >= tileZoom.matrixWidth) nextTile.x = nextTile.x - tileZoom.matrixWidth;
    if (nextTile.x < 0) nextTile.x = nextTile.x + tileZoom.matrixWidth;

    if (nextTile.y >= tileZoom.matrixHeight) nextTile.y = nextTile.y - tileZoom.matrixHeight;
    if (nextTile.y < 0) nextTile.y = nextTile.y + tileZoom.matrixHeight;
    if (seen) {
      const tileId = TileId.fromTile(nextTile);
      if (seen?.has(tileId)) continue;
    }
    todo.push(nextTile);
  }
  return todo;
}

export interface CoveringContext {
  /** Tile matrix to cover with */
  tileMatrix: TileMatrixSet;
  /** MultiPolygon to cover */
  source: MultiPolygon;
  /** Zoom to start covering at */
  targetZoom: number;
  /** Zoom level the imagery is optimized */
  baseZoom: number;
  /** Min amount of a tile to be covered before using a smaller tiler @default 0.25 (25%) */
  minCoveragePercent?: number;
  /** maximal difference between output tiles and input tiles, @default +2 */
  maxZoomDifference?: number;
  /** Cutline to apply */
  cutline: CutlineOptimizer;
  /** Optional metrics provider to track how long actions take */
  metrics?: Metrics;
  /** Optional logger to trace covering creation */
  logger?: LogType;
}

export function createCovering(ctx: CoveringContext): Tile[] {
  const minCoveragePercent = ctx.minCoveragePercent ?? 0.25;
  const maxZoomDifference = ctx.maxZoomDifference ?? 2;

  const outputTiles: Tile[] = [];
  const tileMatrix = ctx.tileMatrix;

  // Reduce the complexity of the cutline applied polygon to same as one pixel at the covering resolution
  // this is a approximation and can cause some false positive/negative tiles.
  // but signficiantly improves performance of finding tile covers
  ctx.metrics?.start('cutline:simplify');
  const onePixelAtOverviewResolution = ctx.tileMatrix.pixelScale(ctx.targetZoom);
  const onePixelAtBaseResolution = ctx.tileMatrix.pixelScale(ctx.baseZoom);
  const cutBounds = Simplify.multiPolygon(
    ctx.cutline.cut(ctx.source), // Cut the source to the cutline
    onePixelAtOverviewResolution,
    onePixelAtBaseResolution, // Remove any polygons that are less than 1 pixel
  );
  const cutlineDuration = ctx.metrics?.end('cutline:simplify');
  // No imagery was left after the cutline
  if (cutBounds == null) throw new Error('Cutline excludes all imagery');
  ctx.logger?.debug({ duration: cutlineDuration }, 'Cutline:Simplified');

  // Tiles that have been seen before
  const visited = new Set<string>();
  const todo: Tile[] = [];

  // Find the tile that intersects with the top left point of each polygon and use that as the starting point
  for (const poly of cutBounds) {
    const topLeftPoint = poly[0][0];
    const targetPx = tileMatrix.sourceToPixels(topLeftPoint[0], topLeftPoint[1], ctx.targetZoom);
    const tile = tileMatrix.pixelsToTile(targetPx.x, targetPx.y, ctx.targetZoom);
    const tileId = TileId.fromTile(tile);
    if (visited.has(tileId)) continue;
    todo.push(tile);
    visited.add(tileId);
  }
  visited.clear();

  const tilesByZoom: number[] = [];
  let zoomDifference = 0;
  while (todo.length > 0) {
    const tile = todo.shift();
    if (tile == null) continue;
    const tileId = TileId.fromTile(tile);
    if (visited.has(tileId)) continue;
    visited.add(tileId);

    const tileSource = tileMatrix.tileToSourceBounds(tile);
    const tileArea = tileSource.width * tileSource.height;

    const tilePolygon = tileSource.toPolygon();
    const tileIntersection = intersection(cutBounds, tilePolygon);
    if (tileIntersection.length === 0) continue;

    // Determine how big of a intersection there is
    const area = Area.multiPolygon(tileIntersection);
    const areaPercent = area / tileArea;

    // Is this tile a different zoom level to our target
    const zDiff = tile.z - ctx.targetZoom;

    // Count the number of pixels in the output tiff that would be used
    const tileScale = tileSource.width / ctx.tileMatrix.tileSize;
    const pixelCount = (tileArea * areaPercent) / tileScale;

    if (areaPercent < minCoveragePercent && zDiff < maxZoomDifference) {
      // Not enough coverage was found with this tile, use a more zoomed in tile and try again
      addChildren(tile, todo);
    } else if (pixelCount > 1) {
      zoomDifference = Math.max(zDiff, zoomDifference);
      outputTiles.push(tile);
      tilesByZoom[tile.z] = (tilesByZoom[tile.z] ?? 0) + 1;
      ctx.logger?.debug({ tileId, areaPercent: Number((areaPercent * 100).toFixed(2)) }, 'Cover:Tile');
      if (outputTiles.length % 25 === 0) {
        ctx.logger?.info({ tiles: outputTiles.length, tilesByZoom }, 'Cover:Progress');
      }
    } else {
      ctx.logger?.debug({ pixelCount, tileId }, 'Cover:SkipTile');
    }

    if (zDiff === 0) addSurrounding(tile, ctx.tileMatrix, todo, visited);
  }

  return outputTiles;
}
