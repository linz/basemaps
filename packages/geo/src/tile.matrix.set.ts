import { Point } from './bounds';
import { Epsg } from './epsg';
import { TileMatrixSetType, TileMatrixSetTypeMatrix } from './tms/tile.matrix.set.type';

export type Tile = Point & { z: number };

export class TileMatrixSet {
    projection: Epsg;
    tileSize: number;
    def: TileMatrixSetType;
    private zooms: TileMatrixSetTypeMatrix[] = [];

    constructor(def: TileMatrixSetType) {
        this.def = def;
        this.tileSize = def.tileMatrix[0].tileHeight;
        for (const z of def.tileMatrix) {
            const zoomIndex = parseInt(z.identifier);
            if (this.zooms[zoomIndex]) throw new Error(`Duplicate tileMatrix identifier: ${z.identifier}`);
            if (z.tileHeight != z.tileWidth) throw new Error('Only square tiles supported');
            if (z.tileHeight != this.tileSize) throw new Error('All tiles must have the same tile size');
            this.zooms[parseInt(z.identifier)] = z;
        }

        const projection = Epsg.parse(def.supportedCRS);
        if (projection == null) throw new Error(`Unable to find supported projection ${def.supportedCRS}`);
        this.projection = projection;
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
        const pX = (sX + z.topLeftCorner[0]) / scale;
        const pY = (sY + z.topLeftCorner[1]) / scale;
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
        const sX = pX * scale - z.topLeftCorner[0];
        const sY = pY * scale - z.topLeftCorner[1];
        return { x: sX, y: sY };
    }
}
