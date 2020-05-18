import * as o from 'ospec';
import { getProjection, Wgs84ToGoogle, guessProjection } from '../index';
import { EPSG } from '@basemaps/geo';

function toFixed(f: number): string {
    return f.toFixed(6);
}

o.spec('Proj2193', () => {
    o('should convert to 2193', () => {
        const Proj2193 = getProjection(2193);
        if (Proj2193 == null) {
            throw new Error('Failed to init proj:2193');
        }
        const output = Proj2193.inverse([1180000.0, 4758000.0]);
        o(output.map(toFixed)).deepEquals([167.454458, -47.1970753].map(toFixed));

        const reverse = Proj2193.forward(output);
        o(reverse.map((f) => Math.floor(f))).deepEquals([1180000.0, 4758000.0]);
    });

    o('should convert to 3793', () => {
        const Proj23793 = getProjection(3793);
        if (Proj23793 == null) {
            throw new Error('Failed to init proj:3793');
        }
    });

    o('Wgs84ToGoogle', () => {
        o(Wgs84ToGoogle.forward([167.454458, -47.1970753])).deepEquals([18640944.995623615, -5974301.313247106]);
    });

    o('should guess WKT', () => {
        o(
            guessProjection(
                'PCS Name = NZGD_2000_New_Zealand_Transverse_Mercator|GCS Name = GCS_NZGD_2000|Ellipsoid = GRS_1980|Primem = Greenwich||',
            ),
        ).equals(EPSG.Nztm2000);

        o(
            guessProjection(
                'NZGD2000_New_Zealand_Transverse_Mercator_2000|GCS Name = GCS_NZGD_2000|Primem = Greenwich||',
            ),
        ).equals(EPSG.Nztm2000);
    });

    o('should not guess unknown wkt', () => {
        o(guessProjection('')).equals(null);
        o(guessProjection('NZTM')).equals(null);
        o(guessProjection('NZGD2000')).equals(null);
    });
});
