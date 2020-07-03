import { Bounds, EpsgCode } from '@basemaps/geo';
import { round } from '@basemaps/test/build/rounding';
import o from 'ospec';
import { Projection } from '../projection';
import { qkToNamedBounds } from './test.util';

o.spec('Projection', () => {
    const googleProj = Projection.get(EpsgCode.Google);
    const nztmProj = Projection.get(EpsgCode.Nztm2000);

    o('should convert to 2193', () => {
        if (nztmProj == null) {
            throw new Error('Failed to init proj:2193');
        }
        const output = nztmProj.toWsg84([1180000, 4758000]);
        o(round(output, 6)).deepEquals([167.454458, -47.197075]);

        const reverse = nztmProj.fromWsg84(output);
        o(round(reverse, 2)).deepEquals([1180000, 4758000]);
    });

    o('toGeoJson', () => {
        const geojson = googleProj.toGeoJson(qkToNamedBounds(['31', '33']));

        const { features } = geojson;

        o(features.length).equals(2);

        o(features[0].properties).deepEquals({ name: '2-3-2' });
        o(features[1].properties).deepEquals({ name: '2-3-3' });
        const { geometry } = features[0]!;
        const coords = geometry.type === 'Polygon' ? geometry.coordinates : null;
        o(round(coords![0], 8)).deepEquals([
            [90, -66.51326044],
            [90, 0],
            [180, 0],
            [180, -66.51326044],
            [90, -66.51326044],
        ]);
    });

    o('projectMultipolygon', () => {
        const poly = [
            Bounds.fromBbox([
                18494091.86765497,
                -6051366.655280836,
                19986142.659781612,
                -4016307.214216303,
            ]).toPolygon(),
        ];

        o(googleProj.projectMultipolygon(poly, googleProj)).equals(poly);

        const ans = googleProj.projectMultipolygon(poly, nztmProj);

        o(round(ans, 4)).deepEquals([
            [
                [
                    [1084733.8967, 4698018.9435],
                    [964788.1197, 6226878.2808],
                    [2204979.5633, 6228860.047],
                    [2090794.171, 4700144.6365],
                    [1084733.8967, 4698018.9435],
                ],
            ],
        ]);
    });
});
