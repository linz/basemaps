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

    private calculateZOffset(): void {
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
    public toTile(qk: string): Tile {
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
    public fromTile(tile: Tile): string {
        const newTile = { x: tile.x, y: tile.y, z: tile.z }; // Do not adjust with the source tile
        if (tile.z >= this.zMax) throw new Error(`tile ${tile.x},${tile.y} z${tile.z} does not map to a quad key`);
        if (this.zOffset != 0) newTile.z += this.zOffset;

        return QuadKey.fromTile(newTile);
    }

    /**
     * Find the nearest suitable quadkeys for a tile
     *
     * The quadkey will be between 0 -> zMax zoom level, and depending on location could be upto 4 parent quadkeys
     *
     */
    public nearestQuadKeys(tile: Tile): string[] {
        if (tile.z < this.zMax) return [this.fromTile(tile)];
        const ul = this.tms.tileToSource(tile);
        const lr = this.tms.tileToSource({ x: tile.x + 1, y: tile.y + 1, z: tile.z });

        const targetZ = this.zMax - 1;

        const ulPixels = this.tms.sourceToPixels(ul.x, ul.y, targetZ);
        const lrPixels = this.tms.sourceToPixels(lr.x, lr.y, targetZ);

        const ulTile = this.tms.pixelsToTile(Math.round(ulPixels.x), Math.round(ulPixels.y), targetZ);
        const lrTile = this.tms.pixelsToTile(Math.round(lrPixels.x - 1), Math.round(lrPixels.y - 1), targetZ);

        const output: string[] = [];
        for (let y = ulTile.y; y <= lrTile.y; y++) {
            for (let x = ulTile.x; x <= lrTile.x; x++) {
                output.push(this.fromTile({ x, y, z: targetZ }));
            }
        }
        return output;
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
        const { matrixWidth, matrixHeight } = this.tms.zooms[tile.z];
        const { matrixWidth: pw, matrixHeight: ph } = this.tms.zooms[z];

        const xfact = pw / matrixWidth;
        const yfact = ph / matrixHeight;

        const xs = Math.floor(tile.x * xfact);
        const ys = Math.floor(tile.y * yfact);

        const xe = Math.floor((tile.x + 1) * xfact);
        const ye = Math.floor((tile.y + 1) * yfact);

        for (let y = ys; y < ye; ++y) {
            for (let x = xs; x < xe; ++x) {
                yield { x, y, z };
            }
        }

        return null;
    }

    /**
     * Iterate over the top level tiles that cover the extent of the `TileMatrixSet`
     */
    *topLevelTiles(): Generator<Tile, null, void> {
        const z = 0;
        const { matrixWidth, matrixHeight } = this.tms.zooms[0];

        for (let y = 0; y < matrixHeight; ++y) {
            for (let x = 0; x < matrixWidth; ++x) {
                yield { x, y, z };
            }
        }

        return null;
    }
}
