import { Bounds, EpsgCode, Tile, TileMatrixSet } from '@basemaps/geo';
import { GoogleTms } from '@basemaps/geo/build/tms/google';
import { Nztm2000Tms } from '@basemaps/geo/build/tms/nztm2000';
import { Projection } from './projection';

export interface LatLon {
    lat: number;
    lon: number;
}

const CodeMap = new Map<EpsgCode, ProjectionTileMatrixSet>();

export class ProjectionTileMatrixSet {
    /** The underlying TileMatrixSet */
    public readonly tms: TileMatrixSet;
    public readonly proj: Projection;
    /** Used to calculate `BlockSize  = blockFactor * tms.tileSize` for generating COGs */
    blockFactor: number;

    /**
     * Wrapper around TileMatrixSet with utilities for converting Points and Polygons
     */
    constructor(tms: TileMatrixSet, blockFactor = 2) {
        this.tms = tms;
        this.blockFactor = blockFactor;
        this.proj = Projection.get(tms.projection.code);
    }

    /**
     * Get the ProjectionTileMatrixSet instance for a specified code,
     *
     * throws a exception if the code is not recognized
     *
     * @param epsgCode
     */
    static get(epsgCode: EpsgCode): ProjectionTileMatrixSet {
        const ptms = CodeMap.get(epsgCode);
        if (ptms != null) return ptms;
        throw new Error(`Invalid projection: ${epsgCode}`);
    }

    /**
     * Try to find a corresponding ProjectionTileMatrixSet for a number
     * @param epsgCode
     */
    static tryGet(epsgCode?: EpsgCode): ProjectionTileMatrixSet | null {
        return (epsgCode && CodeMap.get(epsgCode)) ?? null;
    }

    /**
     * Find the closest zoom level to `resX` (pixels per meter) that is at least as good as `resX`.

     * @param resX

     * @param blockFactor How many time bigger the blockSize is compared to tileSize. Leave as 1 to
     * not take into account.
     */
    getTiffResZoom(resX: number, blockFactor = 1): number {
        // Get best image resolution
        const { tms } = this;
        let z = 0;
        for (; z < tms.zooms.length; ++z) {
            if (tms.pixelScale(z) <= resX * blockFactor) return z;
        }
        if (z == tms.zooms.length) return z - 1;
        throw new Error('ResZoom not found');
    }

    /** Convert a tile to a BBox in source units */
    tileToSourceBounds(tile: Tile): Bounds {
        const ul = this.tms.tileToSource(tile);
        const lr = this.tms.tileToSource({ x: tile.x + 1, y: tile.y + 1, z: tile.z });
        return new Bounds(Math.min(ul.x, lr.x), Math.min(ul.y, lr.y), Math.abs(lr.x - ul.x), Math.abs(lr.y - ul.y));
    }

    /** Convert a tile to the wgs84 bounds */
    tileToWgs84Bounds(tile: Tile): Bounds {
        const ul = this.tms.tileToSource(tile);
        const lr = this.tms.tileToSource({ x: tile.x + 1, y: tile.y + 1, z: tile.z });
        const [ulLon, ulLat] = this.proj.toWsg84([ul.x, ul.y]);
        const [lrLon, lrLat] = this.proj.toWsg84([lr.x, lr.y]);
        return new Bounds(
            Math.min(ulLon, lrLon),
            Math.min(ulLat, lrLat),
            Math.abs(lrLon - ulLon),
            Math.abs(lrLat - ulLat),
        );
    }

    /**
     * return the `lat`, `lon` of a Tile's center
     */
    tileCenterToLatLon(tile: Tile): LatLon {
        const point = this.tms.tileToSource({ x: tile.x + 0.5, y: tile.y + 0.5, z: tile.z });
        const [lon, lat] = this.proj.toWsg84([point.x, point.y]);
        return { lat, lon };
    }

    /**
     * Find the number of alignment levels required to render the tile. Min 1
     *
     * @param tile
     * @param resX the pixel resolution of the source imagery
     */
    findAlignmentLevels(tile: Tile, resX: number): number {
        return Math.max(0, this.getTiffResZoom(resX, this.blockFactor) - tile.z);
    }

    /**
     * Return the expected width in pixels of an image at the tile resolution. Uses
     * `this.blockFactor` for HiDPI tiles.

     * @param tile
     * @param sourceZoom The zoom level for the source imagery
     */
    getImagePixelWidth(tile: Tile, sourceZoom: number): number {
        const ul = this.tms.tileToSource(tile);
        const lr = this.tms.tileToSource({ x: tile.x + 1, y: tile.y + 1, z: tile.z });
        return Math.round((lr.x - ul.x) / this.tms.pixelScale(sourceZoom)) * this.blockFactor;
    }
}

CodeMap.set(EpsgCode.Google, new ProjectionTileMatrixSet(GoogleTms));
CodeMap.set(EpsgCode.Nztm2000, new ProjectionTileMatrixSet(Nztm2000Tms));
