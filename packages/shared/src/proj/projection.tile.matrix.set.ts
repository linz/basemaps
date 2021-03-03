import { EpsgCode, TileMatrixSet } from '@basemaps/geo';
import { GoogleTms } from '@basemaps/geo/build/tms/google';
import { Nztm2000Tms } from '@basemaps/geo/build/tms/nztm2000';
import { Projection } from './projection';

export interface LatLon {
    lat: number;
    lon: number;
}

const CodeMap = new Map<EpsgCode, SProjectionTileMatrixSet>();

export class SProjectionTileMatrixSet {
    /** The underlying TileMatrixSet */
    public readonly tms: TileMatrixSet;
    public readonly proj: Projection;
    /** Used to calculate `BlockSize  = blockFactor * tms.tileSize` for generating COGs */
    blockFactor: number;

    /** Alternative map of tile matrix sets */
    static altMap = new Map<EpsgCode, Map<string, SProjectionTileMatrixSet>>();

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
     * Get the SProjectionTileMatrixSet instance for a specified code,
     *
     * throws a exception if the code is not recognized
     *
     * @param epsgCode
     */
    static get(epsgCode: EpsgCode): SProjectionTileMatrixSet {
        const ptms = CodeMap.get(epsgCode);
        if (ptms != null) return ptms;
        throw new Error(`Invalid projection: ${epsgCode}`);
    }

    /**
     * Try to find a corresponding SProjectionTileMatrixSet for a number

     * @param epsgCode
     * @param alt if present use an alternative SProjectionTileMatrixSet
     */
    static tryGet(epsgCode?: EpsgCode): SProjectionTileMatrixSet | null {
        if (epsgCode == null) return null;

        return CodeMap.get(epsgCode) ?? null;
    }
}

CodeMap.set(EpsgCode.Google, new SProjectionTileMatrixSet(GoogleTms));
CodeMap.set(EpsgCode.Nztm2000, new SProjectionTileMatrixSet(Nztm2000Tms));
