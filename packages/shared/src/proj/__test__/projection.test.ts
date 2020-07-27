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
        const output = nztmProj.toWgs84([1180000, 4758000]);
        o(round(output, 6)).deepEquals([167.454458, -47.197075]);

        const reverse = nztmProj.fromWgs84(output);
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

    o('boundsToWgs84', () => {
        const source = Bounds.fromBbox([1766181, 5439092, 1780544, 5450093]);

        o(round(nztmProj.boundsToWgs84(source).toBbox(), 4)).deepEquals([174.9814, -41.1825, 175.1493, -41.0804]);

        const crossAM = Bounds.fromBbox([1766181, 5439092, 2580544, 5450093]);

        o(round(nztmProj.boundsToWgs84(crossAM).toBbox(), 4)).deepEquals([174.9814, -41.1825, 184.563, -40.5171]);
    });

    o.spec('boundsToGeoJsonFeature', () => {
        o('simple', () => {
            const ans = round(
                googleProj.boundsToGeoJsonFeature(
                    {
                        x: -19929885.00696367,
                        y: 19871181.369240656,
                        width: 48921.969810251147,
                        height: 4891.969810251147,
                    },
                    { name: '13-22-33' },
                ),
            );

            o(ans).deepEquals({
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [-179.03320312, 84.92054529],
                            [-179.03320312, 84.92443459],
                            [-178.59372959, 84.92443459],
                            [-178.59372959, 84.92054529],
                            [-179.03320312, 84.92054529],
                        ],
                    ],
                },
                properties: { name: '13-22-33' },
            });
        });

        o('crosses antimeridian', () => {
            const ans = round(
                nztmProj.boundsToGeoJsonFeature(
                    { x: 1293760, y: 5412480, width: 1246880, height: 1146880 },
                    { name: '1-2-1' },
                ),
            );

            o(ans).deepEquals({
                type: 'Feature',
                geometry: {
                    type: 'MultiPolygon',
                    coordinates: [
                        [
                            [
                                [169.33783769, -41.38093178],
                                [180, -41.22297022],
                                [180, -30.9080246],
                                [169.79094917, -31.05964823],
                                [169.33783769, -41.38093178],
                            ],
                        ],
                        [
                            [
                                [-175.8429206, -40.89543649],
                                [-177.19778597, -30.72635276],
                                [-180, -30.9080246],
                                [-180, -41.22297022],
                                [-175.8429206, -40.89543649],
                            ],
                        ],
                    ],
                },
                properties: { name: '1-2-1' },
            });
        });
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
