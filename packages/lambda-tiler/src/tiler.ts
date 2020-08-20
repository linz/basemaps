import { Epsg, EpsgCode } from '@basemaps/geo';
import { Nztm2000Tms } from '@basemaps/geo/build/tms/nztm2000';
import { GoogleTms } from '@basemaps/geo/build/tms/google';
import { Tiler } from '@basemaps/tiler';

export const DefaultTilers = [new Tiler(GoogleTms), new Tiler(Nztm2000Tms)];
/** *
 * This class is to cache the creation of the tilers, while also providing access
 * so that they can be mocked during tests.
 */
export const Tilers = {
    map: new Map<EpsgCode, Tiler>(),
    /** Lookup a tiler by EPSG Code */
    get(epsg: Epsg): Tiler | undefined {
        return Tilers.map.get(epsg.code);
    },

    add(tiler: Tiler): void {
        Tilers.map.set(tiler.tms.projection.code, tiler);
    },

    /** Reset the tiler cache */
    reset(): void {
        Tilers.map.clear();
        DefaultTilers.forEach((t) => Tilers.add(t));
    },
};

Tilers.reset();
