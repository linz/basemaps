import { Epsg, EpsgCode } from '../epsg';
import { TileMatrixSet } from '../tile.matrix.set';
import { GoogleTms } from './google';
import { Nztm2000QuadTms, Nztm2000Tms } from './nztm2000';

export type Nullish = null | undefined;

export const TileMatrixSets = {
    /** All TileMatrixSets that are currently supported */
    All: [GoogleTms, Nztm2000Tms, Nztm2000QuadTms],
    /** Default mapping of EPSG code to Tile matrix set */
    Defaults: new Map([
        [Epsg.Google.code, GoogleTms],
        [Epsg.Nztm2000.code, Nztm2000Tms],
    ]),
    /**
     * Get a tile matrix set by EPSG Code
     * @throws if no default mapping is made
     */
    get(epsg: Epsg | EpsgCode): TileMatrixSet {
        const tms = this.tryGet(epsg);
        if (tms == null) throw new Error('Failed to lookup TileMatrixSet: ' + epsg);
        return tms;
    },

    /** Attempt to find a mapping from a EPSG code to a default tile matrix set  */
    tryGet(epsg?: Epsg | EpsgCode | Nullish): TileMatrixSet | null {
        if (epsg == null) return null;
        if (typeof epsg === 'number') return this.Defaults.get(epsg) ?? null;
        return this.Defaults.get(epsg.code) ?? null;
    },

    /**
     * Find a tile matrix set give its identifier
     * @param identifier Tile matrix set identifier
     */
    find(identifier: string | Nullish): TileMatrixSet | null {
        if (identifier == null) return null;
        identifier = identifier.toLowerCase();
        for (const tileMatrix of TileMatrixSets.All) {
            if (tileMatrix.identifier.toLowerCase() === identifier) return tileMatrix;
        }
        return null;
    },
};
