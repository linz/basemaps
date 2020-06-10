import { Point } from './bounds';
import { Epsg } from './epsg';
import { TileMatrixSetType, TileMatrixSetTypeMatrix } from './tms/tile.matrix.set.type';
import { getXyOrder, XyOrder } from './xy.order';
import { TileMatrixSetQuadKey } from './tms.quad.key';

export type Tile = Point & { z: number };

/** order by increasing zoom level */
function compareMatrix(a: TileMatrixSetTypeMatrix, b: TileMatrixSetTypeMatrix): number {
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
    readonly zooms: TileMatrixSetTypeMatrix[] = [];

    /** Psuedo quadkey convertor */
    readonly quadKey: TileMatrixSetQuadKey;

    /** Array index of X coordinates */
    indexX = 0;
    /** Array index of y coordinate */
    indexY = 1;

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
            if (z.tileHeight != z.tileWidth) throw new Error('Only square tiles supported');
            if (z.tileHeight != this.tileSize) throw new Error('All tiles must have the same tile size');
            dups[z.identifier] = true;
        }
        this.zooms = zooms;

        const projection = Epsg.parse(def.supportedCRS);
        if (projection == null) throw new Error(`Unable to find supported projection ${def.supportedCRS}`);
        this.projection = projection;

        /** Some projections @see EPSG:2193 are defined with XY Order of  */
        if (getXyOrder(this.projection) == XyOrder.Yx) {
            this.indexX = 1;
            this.indexY = 0;
        }

        this.quadKey = new TileMatrixSetQuadKey(this);
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
}
