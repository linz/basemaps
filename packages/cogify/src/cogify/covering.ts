import { QuadKey, Simplify, Tile, TileMatrixSet } from '@basemaps/geo';
import { LogType } from '@basemaps/shared';
import { Area, intersection, MultiPolygon } from '@linzjs/geojson';
import { Metrics } from '@linzjs/metrics';
import { CutlineOptimizer } from '../cutline';

/** Tile offsets for surrounding tiles */
const SurroundingTiles = [
  { x: 0, y: -1 }, // North
  { x: 0, y: 1 }, // South
  { x: 1, y: 0 }, // East
  { x: -1, y: 0 }, // West
];

function addSurrounding(seen: Set<string>, todo: string[], tile: Tile, z: number): void {
  for (const sr of SurroundingTiles) {
    // TODO this should loop around if it goes outside the bounds of the tile matrix eg crossing the antimeridian
    const nextTile = { z, x: sr.x + tile.x, y: sr.y + tile.y };
    const tileQk = QuadKey.fromTile(nextTile);
    if (seen.has(tileQk)) continue;
    todo.push(tileQk);
  }
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

export function createCovering(ctx: CoveringContext): Set<string> {
  const minCoveragePercent = ctx.minCoveragePercent ?? 0.25;
  const maxZoomDifference = ctx.maxZoomDifference ?? 2;

  const targetTiles = new Set<string>();
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
  const todo: string[] = [];

  // Find the tile that intersects with the top left point of each polygon and use that as the starting point
  for (const poly of cutBounds) {
    const topLeftPoint = poly[0][0];
    const targetPx = tileMatrix.sourceToPixels(topLeftPoint[0], topLeftPoint[1], ctx.targetZoom);
    const targetTile = tileMatrix.pixelsToTile(targetPx.x, targetPx.y, ctx.targetZoom);
    const quadKey = QuadKey.fromTile(targetTile);
    if (todo.includes(quadKey)) continue;
    todo.push(quadKey);
  }

  const tilesByZoom: number[] = [];
  let zoomDifference = 0;
  while (todo.length > 0) {
    const tileQk = todo.shift();
    if (tileQk == null || visited.has(tileQk)) continue;
    const currentTile = QuadKey.toTile(tileQk);

    visited.add(tileQk);

    const tileSource = tileMatrix.tileToSourceBounds(currentTile);
    const tileArea = tileSource.width * tileSource.height;
    const tilePolygon = tileSource.toPolygon();
    const tileIntersection = intersection(cutBounds, tilePolygon);
    if (tileIntersection.length === 0) continue;

    // Determine how big of a intersection there is
    const area = Area.multiPolygon(tileIntersection);
    const areaPercent = area / tileArea;

    // Is this tile a different zoom level to our target
    const zDiff = currentTile.z - ctx.targetZoom;

    if (areaPercent < minCoveragePercent && zDiff < maxZoomDifference) {
      // Not enough coverage was found with this tile, use a more zoomed in tile and try again
      todo.push(...QuadKey.children(tileQk));
    } else {
      zoomDifference = Math.max(zDiff, zoomDifference);
      targetTiles.add(tileQk);
      tilesByZoom[tileQk.length] = (tilesByZoom[tileQk.length] ?? 0) + 1;
      if (targetTiles.size % 25 === 0) {
        ctx.logger?.debug({ tiles: targetTiles.size, tilesByZoom }, 'Cover:Progress');
      }
    }

    if (zDiff === 0) addSurrounding(visited, todo, currentTile, ctx.targetZoom);
  }

  return targetTiles;
}
