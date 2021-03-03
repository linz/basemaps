import { Epsg, GoogleTms, Nztm2000Tms, TileMatrixSet } from '@basemaps/geo';
import { Tiler } from '@basemaps/tiler/build/tiler';

export const DefaultTilers = [new Tiler(GoogleTms), new Tiler(Nztm2000Tms)];

/**
 * This class is to cache the creation of the tilers, while also providing access
 * so that they can be mocked during tests.
 *
 * Alternative tilers can be supported in addition to the standard Web-Mercator (3857) and NZTM2000
 * (2193) tilers. See the `@basemaps/lambda-tiler` `README.md` for instructions.
 */
export const Tilers = {
    map: new Map<string, Tiler>(),
    /** Lookup a tiler by EPSG Code and optional alternative TileMatrixSet */
    get(epsg: Epsg, alt?: string): Tiler | undefined {
        return Tilers.map.get(TileMatrixSet.getId(epsg, alt));
    },

    add(tiler: Tiler): void {
        Tilers.map.set(tiler.tms.id, tiler);
    },

    /** Reset the tiler cache */
    reset(): void {
        Tilers.map.clear();
        DefaultTilers.forEach((t) => Tilers.add(t));
    },
};

Tilers.reset();
