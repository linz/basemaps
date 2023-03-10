import { QuadKey, Tile, TileMatrixSet } from '@basemaps/geo';
import { intersection, MultiPolygon, multiPolygonArea } from '@linzjs/geojson';

/** Tile offsets for surrounding tiles */
const SurroundingTiles = [
  { x: 0, y: -1 }, // North
  { x: 0, y: 1 }, // South
  { x: 1, y: 0 }, // East
  { x: -1, y: 0 }, // West
];

function addSurrounding(seen: Set<string>, todo: Tile[], tile: Tile, z: number): void {
  for (const sr of SurroundingTiles) {
    // TODO this should loop around if it goes outside the bounds eg crossing the antimeridian
    const nextTile = { z, x: sr.x + tile.x, y: sr.y + tile.y };
    const tileQk = QuadKey.fromTile(nextTile);
    if (seen.has(tileQk)) continue;
    todo.push(nextTile);
  }
}

export interface CoveringContext {
  /** Tile matrix to cover with */
  tileMatrix: TileMatrixSet;
  /** MultiPolygon to cover */
  source: MultiPolygon;
  /** Zoom to start covering at */
  targetZoom: number;
  /** Min amount of a tile to be covered before using a smaller tiler @default 0.25 (25%) */
  minCoveragePercent?: number;
  /** maximal difference between output tiles and input tiles, @default +2 */
  maxZoomDifference?: number;
}

export function createCovering(ctx: CoveringContext): Set<string> {
  const targetTiles = new Set<string>();
  const tileMatrix = ctx.tileMatrix;

  const minCoveragePercent = ctx.minCoveragePercent ?? 0.25;
  const maxZoomDifference = ctx.maxZoomDifference ?? 2;

  let zoomDifference = 0;

  for (const poly of ctx.source) {
    // Find the tile that intersects with the top left point and use that as the starting point
    const topLeftPoint = poly[0][0];
    const targetPx = tileMatrix.sourceToPixels(topLeftPoint[0], topLeftPoint[1], ctx.targetZoom);
    const targetTile = tileMatrix.pixelsToTile(targetPx.x, targetPx.y, ctx.targetZoom);

    // Tiles that have been seen before
    const visited = new Set<string>();
    const todo: Tile[] = [targetTile];

    while (todo.length > 0) {
      const currentTile = todo.shift();
      if (currentTile == null) continue;
      const tileQk = QuadKey.fromTile(currentTile);
      if (visited.has(tileQk)) continue;
      visited.add(tileQk);

      const tileSource = tileMatrix.tileToSourceBounds(currentTile);
      const tileArea = tileSource.width * tileSource.height;
      const tilePolygon = tileSource.toPolygon();
      const tileIntersection = intersection(poly, tilePolygon);
      if (tileIntersection.length === 0) continue;

      // Determine how big of a intersection there is
      const area = multiPolygonArea(tileIntersection);
      const areaPercent = area / tileArea;

      // Is this tile a different zoom level to our target
      const zDiff = currentTile.z - ctx.targetZoom;

      if (areaPercent < minCoveragePercent && zDiff < maxZoomDifference) {
        // Not enough coverage was found with this tile, use a more zoomed in tile and try again
        todo.push(...QuadKey.children(tileQk).map((qk) => QuadKey.toTile(qk)));
      } else {
        zoomDifference = Math.max(zDiff, zoomDifference);
        targetTiles.add(tileQk);
      }

      if (zDiff === 0) addSurrounding(visited, todo, currentTile, ctx.targetZoom);
    }
  }

  // If all tiles are at the same zoom level, no need to dedupe parent/child combinations
  if (zoomDifference === 0) return targetTiles;

  // Child tiles were added, validate that no parent/child combinations were added
  for (const qk of targetTiles) {
    // tile is already of target zoom no parent tiles can be added
    if (qk.length === ctx.targetZoom) continue;

    // Check if a parent tile was added
    let parentQk = QuadKey.parent(qk);
    while (parentQk.length >= ctx.targetZoom) {
      if (targetTiles.has(parentQk)) {
        targetTiles.delete(qk);
        break;
      }
      parentQk = QuadKey.parent(parentQk);
    }
  }

  return targetTiles;
}
