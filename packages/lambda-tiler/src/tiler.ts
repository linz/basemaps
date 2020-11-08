import { Epsg, EpsgCode } from '@basemaps/geo';
import { GoogleTms } from '@basemaps/geo/build/tms/google';
import { Nztm2000Tms } from '@basemaps/geo/build/tms/nztm2000';
import { ProjectionTileMatrixSet } from '@basemaps/shared';
import { AltTileMatrixSet } from '@basemaps/shared/build/alternative.tms/alt.tms';
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
    map: new Map<EpsgCode, Tiler>(),
    /** Map of alternative TileMatrixSets by alt-name, EpsgCode */
    alt: new Map<EpsgCode, Map<string, Tiler>>(),
    /** Lookup a tiler by EPSG Code and optional alternative TileMatrixSet */
    get(epsg: Epsg, alt?: string): Tiler | undefined {
        if (alt != null) {
            return Tilers.alt.get(epsg.code)?.get(alt);
        }
        return Tilers.map.get(epsg.code);
    },

    add(tiler: Tiler): void {
        Tilers.map.set(tiler.tms.projection.code, tiler);
    },

    /** Reset the tiler cache */
    reset(): void {
        Tilers.map.clear();
        DefaultTilers.forEach((t) => Tilers.add(t));

        Tilers.alt.clear();
        for (const [code, pmap] of ProjectionTileMatrixSet.altMap.entries()) {
            for (const [altName, { tms }] of pmap) {
                if (!(tms instanceof AltTileMatrixSet)) throw new Error('invalid AltTileMatrixSet');
                let map = Tilers.alt.get(code);
                if (map == null) {
                    map = new Map<string, Tiler>();
                    Tilers.alt.set(code, map);
                }
                map.set(altName, new Tiler(tms, tms.convertZ));
            }
        }
    },
};

Tilers.reset();
