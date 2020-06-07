import { QuadKey } from './quad.key';
import { Tile, TileMatrixSet } from './tile.matrix.set';

export class TileMatrixSetQuadKey {
    tms: TileMatrixSet;
    /**
     *  Quadkeys need to have a tile that is 1x1 at the root level qk:""
     *  this offset is the number of zoom levels that are made up to make "" a 1x1 tile
     */
    zOffset = 0;

    /**
     * Maximum zoom level that can be represented as a quad key
     *
     * All tiles have be `tile.z < zMax`
     */
    zMax = 0;

    constructor(tms: TileMatrixSet) {
        this.tms = tms;

        const [firstZoom] = tms.zooms;
        // If this tile matrix set does not have a 1x1 root tile, we need to zoom out until we can make a psuedo z0
        if (firstZoom.matrixWidth != 1 || firstZoom.matrixHeight != 1) {
            this.calculateZOffset();
        }

        // Find the highest zoom tile that is still a power of two
        const scaleDenominator = firstZoom.scaleDenominator;
        for (const z of tms.zooms) {
            if (z.tileHeight != z.tileWidth) throw new Error('Only square tiles supported');
            if (z.tileHeight != tms.tileSize) throw new Error('All tiles must have the same tile size');

            const scale = Math.log2(scaleDenominator / z.scaleDenominator);
            // Is this zoom close to being a power of two, sometimes floating point math gets in the way `1.9999999996`
            if (!Number.isInteger(Math.round(scale * 1e6) / 1e6)) {
                break;
            }
            this.zMax++;
        }
    }

    calculateZOffset(): void {
        const [firstZoom] = this.tms.zooms;

        const biggestXy = Math.max(firstZoom.matrixWidth, firstZoom.matrixHeight);
        this.zOffset = Math.log2(biggestXy);
        // TODO we could pad the width/height out to a power of 2 tile count
        if (!Number.isInteger(this.zOffset)) throw new Error('Unable to find suitable zOffset');
    }

    /**
     * Attempt to convert a quadkey to a tile index
     *
     * This will throw if the quadkey does not map to a tile inside the tile matrix set
     *
     * @param qk Quadkey to convert
     */
    toTile(qk: string): Tile {
        const tile = QuadKey.toTile(qk);
        if (this.zOffset != 0) tile.z -= this.zOffset;

        if (tile.z < 0) throw new Error(`QuadKey "${qk}" does not map to a tile`);
        if (tile.z >= this.zMax) throw new Error(`QuadKey "${qk}" does not map to a tile`);

        const zoom = this.tms.zooms[tile.z];
        if (zoom == null) throw new Error(`QuadKey "${qk}" does not map to a tile`);
        if (tile.x >= zoom.matrixWidth) throw new Error(`QuadKey "${qk}" does not map to a tile`);
        if (tile.y >= zoom.matrixHeight) throw new Error(`QuadKey "${qk}" does not map to a tile`);

        return tile;
    }

    /**
     * Convert a tile to a quadkey
     *
     * this will throw if tile is outside of the bounds of the quad key
     *
     * @param tile Tile to convert
     */
    fromTile(tile: Tile): string {
        const newTile = { x: tile.x, y: tile.y, z: tile.z }; // Do not adjust with the source tile
        if (tile.z >= this.zMax) throw new Error(`tile ${tile.x},${tile.y} z${tile.z} does not map to a quad key`);
        if (this.zOffset != 0) newTile.z += this.zOffset;

        return QuadKey.fromTile(newTile);
    }
}
