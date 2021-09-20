import { TileMatrixSetType, TileMatrixType } from '@linzjs/tile-matrix-set';
import { Bounds, Point } from './bounds.js';
import { Epsg } from './epsg.js';
import { getXyOrder, XyOrder } from './xy.order.js';

export type Tile = Point & { z: number };

/** order by increasing zoom level */
function compareMatrix(a: TileMatrixType, b: TileMatrixType): number {
  return b.scaleDenominator - a.scaleDenominator;
}

export class TileMatrixSet {
  /** Projection of the matrix set */
  projection: Epsg;

  /** Number of pixels for a tile */
  tileSize: number;
  /**
   * Raw tile matrix definition
   *
   * Avoid directly accessing this object
   */
  readonly def: TileMatrixSetType;
  /** Indexed tile index zooms */
  readonly zooms: TileMatrixType[] = [];

  /** Array index of X coordinates */
  indexX = 0;
  /** Array index of y coordinate */
  indexY = 1;

  /** The full extent (boundingBox) from the TileMatrixSetType definition */
  readonly extent: Bounds;

  /**
     * Create using a WMTS EPSG definition

     * @param def
     */
  constructor(def: TileMatrixSetType) {
    this.def = def;
    this.tileSize = def.tileMatrix[0].tileHeight;

    const zooms = def.tileMatrix.slice().sort(compareMatrix);
    const dups: Record<string, boolean> = {};
    for (const z of zooms) {
      if (dups[z.identifier]) throw new Error(`Duplicate tileMatrix identifier ${z.identifier}`);
      if (z.tileHeight !== z.tileWidth) throw new Error('Only square tiles supported');
      if (z.tileHeight !== this.tileSize) throw new Error('All tiles must have the same tile size');
      dups[z.identifier] = true;
    }
    this.zooms = zooms;

    const projection = Epsg.parse(def.supportedCRS);
    if (projection == null) throw new Error(`Unable to find supported projection ${def.supportedCRS}`);
    this.projection = projection;

    /** Some projections @see EPSG:2193 are defined with XY Order of  */
    if (getXyOrder(this.projection) === XyOrder.Yx) {
      this.indexX = 1;
      this.indexY = 0;
    }

    const { lowerCorner, upperCorner } = def.boundingBox;
    const x = lowerCorner[this.indexX];
    const y = lowerCorner[this.indexY];
    this.extent = new Bounds(x, y, upperCorner[this.indexX] - x, upperCorner[this.indexY] - y);
  }

  /**
   * Maximum zoom level
   * Valid zoom levels are 0 - maxZoom (inclusive)
   */
  get maxZoom(): number {
    return this.zooms.length - 1;
  }

  get identifier(): string {
    return this.def.identifier;
  }

  /** Get the pixels / meter at a specified zoom level */
  pixelScale(zoom: number): number {
    const z = this.zooms[zoom];
    if (z == null) throw new Error(`Zoom not found :${zoom}`);
    // TODO support non meters projections
    /**
     * http://docs.opengeospatial.org/is/17-083r2/17-083r2.html#table_2:
     * The pixel size of the tile can be obtained from the scaleDenominator by
     * multiplying the later by 0.28 10-3 / metersPerUnit
     */
    return z.scaleDenominator * 0.28e-3;
  }

  public tileToPixels(tX: number, tY: number): Point {
    return { x: tX * this.tileSize, y: tY * this.tileSize };
  }

  /**
   * Convert a pixel point into tile offset
   *
   * @param pX pixel X offset
   * @param pY pixel Y offset
   * @param zoom pixel zoom level
   */
  public pixelsToTile(pX: number, pY: number, zoom: number): Tile {
    const x = Math.floor(pX / this.tileSize);
    const y = Math.floor(pY / this.tileSize);
    return { x, y, z: zoom };
  }

  /**
   * Convert a XYZ tile into the raster bounds for the tile
   *
   * @param tX tile X offset
   * @param tY tile Y offset
   * @param zoom tile zoom level
   */
  public sourceToPixels(sX: number, sY: number, zoom: number): Point {
    const z = this.zooms[zoom];
    const scale = this.pixelScale(zoom);
    const pX = (sX - z.topLeftCorner[this.indexX]) / scale;
    const pY = (z.topLeftCorner[this.indexY] - sY) / scale;
    return { x: pX, y: pY };
  }

  /**
   * Convert a pixel offset into source units ()
   * @param pX pixel X offset
   * @param pY pixel Y offset
   * @param zoom pixel zoom level
   */
  public pixelsToSource(pX: number, pY: number, zoom: number): Point {
    const z = this.zooms[zoom];
    const scale = this.pixelScale(zoom);
    const sX = z.topLeftCorner[this.indexX] + pX * scale;
    const sY = z.topLeftCorner[this.indexY] - pY * scale;
    return { x: sX, y: sY };
  }

  /**
   * Get the source units for a `tile` upper left point
   */
  public tileToSource(tile: Tile): Point {
    const ul = this.tileToPixels(tile.x, tile.y);
    return this.pixelsToSource(ul.x, ul.y, tile.z);
  }

  /**
   * Get the boundingBox for a `tile` in source units
   */
  public tileToSourceBounds(tile: Tile): Bounds {
    const ul = this.tileToSource(tile);
    const width = this.pixelScale(tile.z) * this.tileSize;
    return new Bounds(ul.x, ul.y - width, width, width);
  }

  /**
   * Iterate over the top level tiles that cover the extent of the `TileMatrixSet`
   */
  *topLevelTiles(): Generator<Tile, null, void> {
    const z = 0;
    const { matrixWidth, matrixHeight } = this.zooms[0];

    for (let y = 0; y < matrixHeight; ++y) {
      for (let x = 0; x < matrixWidth; ++x) {
        yield { x, y, z };
      }
    }

    return null;
  }

  /**
     * Iterate over the child (`z+1`) tiles that cover `tile`

     * @param tile
     */
  *coverTile(tile?: Tile): Generator<Tile, null, void> {
    if (tile == null) {
      yield* this.topLevelTiles();
      return null;
    }
    const z = tile.z + 1;
    const { matrixWidth, matrixHeight } = this.zooms[tile.z];
    const { matrixWidth: childWidth, matrixHeight: childHeight } = this.zooms[z];

    const xScale = childWidth / matrixWidth;
    const yScale = childHeight / matrixHeight;

    const xStart = Math.floor(tile.x * xScale);
    const yStart = Math.floor(tile.y * yScale);

    const xEnd = Math.ceil((tile.x + 1) * xScale);
    const yEnd = Math.ceil((tile.y + 1) * yScale);

    for (let y = yStart; y < yEnd; ++y) {
      for (let x = xStart; x < xEnd; ++x) {
        yield { x, y, z };
      }
    }

    return null;
  }

  /**
   * Make a name for a `tile`
   */
  public static tileToName(tile: Tile): string {
    return `${tile.z}-${tile.x}-${tile.y}`;
  }

  /**
   * Convert `name` to a `tile`
   */
  public static nameToTile(name: string): Tile {
    const parts = name.split('-');
    if (parts.length === 3) {
      const z = Number(parts[0]);
      const x = Number(parts[1]);
      const y = Number(parts[2]);
      if (!(isNaN(z) || isNaN(y) || isNaN(x))) {
        return { x, y, z };
      }
    }
    throw new Error(`Invalid tile name '${name}'`);
  }

  /** Mapping of scaleFactor to closet scaleFactor  */
  private zoomConversionMap = new Map<number, number>();
  /**
   * Find the closest matching zoom to the given scale
   * @param scaleDenominator scale to match
   * @returns the zoom level of the closest matching zoom
   */
  findBestZoom(scaleDenominator: number): number {
    let zoom = this.zoomConversionMap.get(scaleDenominator);
    if (zoom == null) {
      zoom = this.convertZoomLevel(scaleDenominator);
      this.zoomConversionMap.set(scaleDenominator, zoom);
    }
    return zoom;
  }

  private convertZoomLevel(scaleDenominator: number): number {
    for (let i = 0; i < this.zooms.length; i++) {
      const scaleDiff = this.zooms[i].scaleDenominator - scaleDenominator;
      if (scaleDiff > 0.00001) continue;
      if (i === 0) return i;
      // Check the previous scale diff as it may actually be closer in scale
      const lastScaleDiff = this.zooms[i - 1].scaleDenominator - scaleDenominator;
      const isCurrentSmaller = Math.abs(scaleDiff) < lastScaleDiff;
      if (isCurrentSmaller) return i;
      return i - 1;
    }
    return this.maxZoom;
  }

  /**
   * Convert a given zoom level from one tile matrix to another
   * @param z Zoom to convert
   * @param from Tile matrix to convert from
   * @param to  Tile matrix to convert to
   * @param mapMinMax Should the min (0) and max be converted directly across,
   *  for example if from.maxZoom = 10 and to.maxZoom = 30, when z is 10 it will always return 30, even if there are other scales that would match
   * @returns converted zoom level
   */
  static convertZoomLevel(z: number, from: TileMatrixSet, to: TileMatrixSet, mapMinMax = true): number {
    // Same matrix no mapping needed
    if (from.identifier === to.identifier) return z;
    if (z >= from.maxZoom) z = from.maxZoom;

    // Map min/max to min/max zoom
    if (mapMinMax && z === 0) return z;
    if (mapMinMax && z === from.maxZoom) return to.maxZoom;

    return to.findBestZoom(from.zooms[z].scaleDenominator);
  }
}
