import { EpsgCode, Tile, TileMatrixSet } from '@basemaps/geo';
import { GoogleTms } from '@basemaps/geo/build/tms/google';
import { Nztm2000Tms } from '@basemaps/geo/build/tms/nztm2000';
import { BBox } from '@linzjs/geojson';
import { Nztm2000AgolTms } from '../alternative.tms/nztm2000.agol';
import { Projection } from './projection';

/**
 * The list of alternative TMS definitions see `README.md`
 */
const AlternativeTmsList = [Nztm2000AgolTms];

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

    /** Alternative map of tile matrix sets */
    static altMap = new Map<EpsgCode, Map<string, ProjectionTileMatrixSet>>();

    /**
     * Wrapper around TileMatrixSet with utilities for converting Points and Polygons
     */
    constructor(tms: TileMatrixSet, blockFactor = 2) {
        this.tms = tms;
        this.blockFactor = blockFactor;
        this.proj = Projection.get(tms.projection.code);
    }

    static targetCodes(): IterableIterator<EpsgCode> {
        return CodeMap.keys();
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
     * @param alt if present use an alternative ProjectionTileMatrixSet
     */
    static tryGet(epsgCode?: EpsgCode, alt?: string): ProjectionTileMatrixSet | null {
        if (epsgCode == null) return null;
        if (alt != null) {
            return this.altMap.get(epsgCode)?.get(alt.toLowerCase()) ?? null;
        }

        return CodeMap.get(epsgCode) ?? null;
    }

    /**
     * Find the closest zoom level to `gsd` (Ground Sampling Distance meters per pixel) that is at
     * least as good as `gsd`.

     * @param gsd

     * @param blockFactor How many time bigger the blockSize is compared to tileSize. Leave as 1 to
     * not take into account.
     */
    getTiffResZoom(gsd: number, blockFactor = 1): number {
        // Get best image resolution
        const { tms } = this;
        let z = 0;
        for (; z < tms.zooms.length; ++z) {
            if (tms.pixelScale(z) <= gsd * blockFactor) return z;
        }
        if (z === tms.zooms.length) return z - 1;
        throw new Error('ResZoom not found');
    }

    /** Convert a tile to the wgs84 bounds */
    tileToWgs84Bbox(tile: Tile): BBox {
        const ul = this.tms.tileToSource(tile);
        const lr = this.tms.tileToSource({ x: tile.x + 1, y: tile.y + 1, z: tile.z });

        const [swLon, swLat] = this.proj.toWgs84([ul.x, lr.y]);
        const [neLon, neLat] = this.proj.toWgs84([lr.x, ul.y]);

        return [swLon, swLat, neLon, neLat];
    }

    /**
     * return the `lat`, `lon` of a Tile's center
     */
    tileCenterToLatLon(tile: Tile): LatLon {
        const point = this.tms.tileToSource({ x: tile.x + 0.5, y: tile.y + 0.5, z: tile.z });
        const [lon, lat] = this.proj.toWgs84([point.x, point.y]);
        return { lat, lon };
    }

    /**
     * Find the number of alignment levels required to render the tile. Min 1
     *
     * @param tile
     * @param gsd the pixel resolution of the source imagery
     */
    findAlignmentLevels(tile: Tile, gsd: number): number {
        return Math.max(0, this.getTiffResZoom(gsd, this.blockFactor) - tile.z);
    }

    /**
     * Return the expected width in pixels of an image at the tile resolution. Uses
     * `this.blockFactor` for HiDPI tiles.

     * @param tile
     * @param targetZoom The desired zoom level for the imagery
     */
    getImagePixelWidth(tile: Tile, targetZoom: number): number {
        const ul = this.tms.tileToSource(tile);
        const lr = this.tms.tileToSource({ x: tile.x + 1, y: tile.y + 1, z: tile.z });
        return Math.round((lr.x - ul.x) / this.tms.pixelScale(targetZoom)) * this.blockFactor;
    }
}

CodeMap.set(EpsgCode.Google, new ProjectionTileMatrixSet(GoogleTms));
CodeMap.set(EpsgCode.Nztm2000, new ProjectionTileMatrixSet(Nztm2000Tms));

for (const tms of AlternativeTmsList) {
    let map = ProjectionTileMatrixSet.altMap.get(tms.projection.code);
    if (map == null) {
        map = new Map<string, ProjectionTileMatrixSet>();
        ProjectionTileMatrixSet.altMap.set(tms.projection.code, map);
    }
    map.set(tms.altName, new ProjectionTileMatrixSet(Nztm2000AgolTms));
}
