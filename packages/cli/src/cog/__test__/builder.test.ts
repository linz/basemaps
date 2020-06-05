import { Epsg } from '@basemaps/geo';
import * as o from 'ospec';
import { guessProjection } from '../builder';

o.spec('Builder', () => {
    o('should guess WKT', () => {
        o(
            guessProjection(
                'PCS Name = NZGD_2000_New_Zealand_Transverse_Mercator|GCS Name = GCS_NZGD_2000|Ellipsoid = GRS_1980|Primem = Greenwich||',
            ),
        ).equals(Epsg.Nztm2000);

        o(
            guessProjection(
                'NZGD2000_New_Zealand_Transverse_Mercator_2000|GCS Name = GCS_NZGD_2000|Primem = Greenwich||',
            ),
        ).equals(Epsg.Nztm2000);
    });

    o('should not guess unknown wkt', () => {
        o(guessProjection('')).equals(null);
        o(guessProjection('NZTM')).equals(null);
        o(guessProjection('NZGD2000')).equals(null);
    });
});
