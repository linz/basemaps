import { Epsg, EpsgCode } from '@basemaps/geo';
import { LogConfig, ProjectionTileMatrixSet } from '@basemaps/shared';
import { round } from '@basemaps/test/build/rounding';
import { CogTiff, TiffTagGeo } from '@cogeotiff/core';
import o from 'ospec';
import { CogBuilder, guessProjection } from '../builder';

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

    o.spec('tiff', () => {
        const googleBuilder = new CogBuilder(ProjectionTileMatrixSet.get(EpsgCode.Google), 1, LogConfig.get());
        const tiff = {
            source: { name: 'test1.tiff' },
            getImage(n: number): any {
                if (n != 0) return null;
                return {
                    bbox: [1492000, 6198000, 1492000 + 24000, 6198000 + 36000],
                    valueGeo(key: number): any {
                        if (key === TiffTagGeo.ProjectedCSTypeGeoKey) return EpsgCode.Nztm2000;
                    },
                };
            },
        } as CogTiff;

        o('getTifBounds', () => {
            o(round(googleBuilder.getTifBounds(tiff), 2)).deepEquals({
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [171.83, -34.03],
                            [171.83, -34.35],
                            [172.09, -34.36],
                            [172.09, -34.03],
                            [171.83, -34.03],
                        ],
                    ],
                },
                properties: { tiff: 'test1.tiff' },
            });
        });
    });
});
