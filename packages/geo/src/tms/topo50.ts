import { Tile, TileMatrixSet, TileMatrixSetTypeOrdered } from '../tile.matrix.set.js';

// Map Sheets are 24,000 x 36,000 meters, at 50_000 scale with the tile matrix set using 0.28mm / pixel
// this calculates out to these width and height in pixels
const tileWidth = 24_000 / (50000 * TileMatrixSet.ScaleDenominatorRatio);
const tileHeight = 36_000 / (50000 * TileMatrixSet.ScaleDenominatorRatio);

const Topo50tmsT: TileMatrixSetTypeOrdered = {
  type: 'TileMatrixSetType',
  title: 'Topo50 tile matrix',
  identifier: 'Topo50',
  orderedAxes: ['Y', 'X'],
  boundingBox: {
    type: 'BoundingBoxType',
    crs: 'http://www.opengis.net/def/crs/EPSG/0/2193',
    lowerCorner: [4578000, 2524000],
    upperCorner: [6882000, 988000],
  },
  supportedCRS: 'https://www.opengis.net/def/crs/EPSG/0/2193',
  tileMatrix: [
    {
      type: 'TileMatrixType',
      identifier: '50k',
      scaleDenominator: 50000,
      topLeftCorner: [6882000, 988000],
      tileWidth,
      tileHeight,
      matrixHeight: 64,
      matrixWidth: 64,
    },
    {
      type: 'TileMatrixType',
      identifier: '10k',
      scaleDenominator: 10000,
      topLeftCorner: [6882000, 988000],
      tileWidth,
      tileHeight,
      matrixHeight: 320,
      matrixWidth: 320,
    },
    {
      type: 'TileMatrixType',
      identifier: '5k',
      scaleDenominator: 5000,
      topLeftCorner: [6882000, 988000],
      tileWidth,
      tileHeight,
      matrixHeight: 640,
      matrixWidth: 640,
    },
    {
      type: 'TileMatrixType',
      identifier: '1k',
      scaleDenominator: 1000,
      topLeftCorner: [6882000, 988000],
      tileWidth,
      tileHeight,
      matrixHeight: 3200,
      matrixWidth: 3200,
    },
    {
      type: 'TileMatrixType',
      identifier: '500m',
      scaleDenominator: 500,
      topLeftCorner: [6882000, 988000],
      tileWidth,
      tileHeight,
      matrixHeight: 6400,
      matrixWidth: 6400,
    },
  ],
};

export const Topo50Tms = new TileMatrixSet(Topo50tmsT);

const SheetCodeRegex = /^[A-Z][A-Z][0-9][0-9]$/;
const charA = 'A'.charCodeAt(0);

function getTopLevelTile(tile: Tile): Tile {
  if (tile.z === 0) return tile;
  const pt = Topo50Tms.tileToSource({ x: tile.x + 0.5, y: tile.y + 0.5, z: tile.z });
  const px = Topo50Tms.sourceToPixels(pt.x, pt.y, 0);
  return Topo50Tms.pixelsToTile(px.x, px.y, 0);
}

/**
 * Convert Topo50Tms tiles into topo50 names
 */
export const Topo50Tile = {
  /**
   * Convert a Topo50TileMatrix tile X, Y and Z into the map sheet name
   *
   * @example
   *
   * ```
   * toSheetCode({x: 31, y:40, z:0}) // BQ31
   * ```
   */
  toSheetCode(tile: Tile): string {
    const topTile = getTopLevelTile(tile);
    let charYOffset = topTile.y;

    // BI does not exist
    if (charYOffset >= 34) charYOffset++;
    // BO does not exist
    if (charYOffset >= 40) charYOffset++;
    // CI does not exist
    if (charYOffset >= 60) charYOffset++;

    const firstLetterOffset = String.fromCharCode(Math.floor(charYOffset / 26) + charA);
    const secondLetterOffset = String.fromCharCode((charYOffset % 26) + charA);

    return `${firstLetterOffset}${secondLetterOffset}${String(topTile.x).padStart(2, '0')}`;
  },
  /**
   * Convert a Topo50 Sheet code into a Topo50TileMatrix Tile
   *
   * @example
   *
   * ```
   * toSheetCode('BQ31') // {x: 31, y:40, z:0}
   * ```
   */
  fromSheetCode(sheetCode: string): Tile {
    if (!sheetCode.match(SheetCodeRegex)) throw new Error('Sheet code must be in the format AA00');
    // if (sheetCode.length !== 4)
    const ms = sheetCode.slice(0, 2);
    const x = Number(sheetCode.slice(2));
    // if (isNaN(x)) throw new Error('Sheet code must be in the format AA00');

    const firstLetterOffset = (ms.charCodeAt(0) - charA) * 26;
    const secondLetterOffset = ms.charCodeAt(1) - charA;

    let charYOffset = firstLetterOffset + secondLetterOffset;
    // CI does not exist
    if (charYOffset >= 60) charYOffset--;
    // BO does not exist
    if (charYOffset >= 40) charYOffset--;
    // BI does not exist
    if (charYOffset >= 34) charYOffset--;

    return { x, y: charYOffset, z: 0 };
  },

  /**
   * Convert a tile into a longer tile name
   *
   * ```typescript
   * toSheetCode({x: 31, y:40, z: 0}) // BQ31
   * toSheetCode({x: 0, y: 0, z: 0}) // AA00
   * toSheetCode({x: 0, y: 0, z: 1}) // AA00_10000_0101
   * ```
   *
   * @param tile
   * @returns
   */
  toName(tile: Tile): string {
    const topTile = getTopLevelTile(tile);
    const sheetCode = Topo50Tile.toSheetCode(topTile);

    const zoom = Topo50Tms.zooms[tile.z];
    if (zoom.scaleDenominator === 50_000) return sheetCode;

    const sheetOrigin = Topo50Tms.tileToSource(topTile);
    const tileOrigin = Topo50Tms.tileToSource(tile);

    const tileScale = Topo50Tms.pixelScale(tile.z);

    const tileWidth = tileScale * Topo50Tms.tileWidth;
    const tileHeight = tileScale * Topo50Tms.tileHeight;

    const tileOffsetX = tileOrigin.x - sheetOrigin.x;
    const tileOffsetY = sheetOrigin.y - tileOrigin.y;

    const tileX = Math.floor(tileOffsetX / tileWidth) + 1; // offsetX starts at 01
    const tileY = Math.floor(tileOffsetY / tileHeight) + 1; // offsetY starts at 01

    const digits = zoom.scaleDenominator === 500 ? 3 : 2;
    const tileId = String(tileY).padStart(digits, '0') + String(tileX).padStart(digits, '0');

    return `${sheetCode}_${zoom.scaleDenominator}_${tileId}`;
  },
};
