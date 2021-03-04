import { Epsg, EpsgCode } from '../epsg';
import { TileMatrixSet } from '../tile.matrix.set';
import { GoogleTms } from './google';
import { Nztm2000Tms } from './nztm2000';

export const TileMatrixSets = {
    All: [GoogleTms, Nztm2000Tms],
    Defaults: new Map([
        [Epsg.Google.code, GoogleTms],
        [Epsg.Nztm2000.code, Nztm2000Tms],
    ]),
    get(epsg: Epsg | EpsgCode): TileMatrixSet {
        const tms = this.tryGet(epsg);
        if (tms == null) throw new Error('Failed to lookup TileMatrixSet: ' + epsg);
        return tms;
    },
    tryGet(epsg?: Epsg | EpsgCode | null): TileMatrixSet | undefined {
        if (epsg == null) return undefined;
        if (typeof epsg === 'number') return this.Defaults.get(epsg);
        return this.Defaults.get(epsg.code);
    },

    find(text: string): TileMatrixSet | null {
        for (const tms of TileMatrixSets.All) {
            if (tms.identifier === text) return tms;
        }
        return null;
    },
};
