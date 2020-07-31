import { Bounds, EpsgCode } from '@basemaps/geo';
import { round } from '@basemaps/test/build/rounding';
import o from 'ospec';
import { MultiPolygon, Ring } from '../../clipped.multipolygon';
import { Projection } from '../projection';
import { qkToNamedBounds } from './test.util';

function intToSource(ring: number[][], base = [0, 0], factor = 1): Ring {
    return ring.map((point) => point.map((n, i) => base[i] + n * factor)) as Ring;
}

function toGoogle(ring: number[][]): Ring {
    return intToSource(ring, [19430000, -5008000], 10000);
}

function toNztm(ring: number[][]): Ring {
    return intToSource(ring, [1741000, 5448000], 20000);
}

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

    o.spec('multiPolygonToWgs84', () => {
        o('simple', () => {
            const poly = [
                [
                    toGoogle([
                        [0, 1],
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1],
                    ]),
                ],
            ];

            const ans = round(googleProj.multiPolygonToWgs84(poly), 4);

            o(ans).deepEquals([
                [
                    [
                        [174.5427, -40.9027],
                        [174.5427, -40.9706],
                        [174.6325, -40.9706],
                        [174.6325, -40.9027],
                        [174.5427, -40.9027],
                    ],
                ],
            ]);
        });

        o('crosses antimeridian', () => {
            const poly: MultiPolygon = [
                [
                    toNztm([
                        [0, 1],
                        [0, 0],
                        [30, 0],
                        [30, 1],
                        [0, 1],
                    ]),
                ],
            ];

            const ans = round(nztmProj.multiPolygonToWgs84(poly), 4);

            o(ans).deepEquals([
                [
                    [
                        [174.6747, -40.927],
                        [174.6792, -41.1071],
                        [180, -40.9055],
                        [180, -40.7255],
                        [174.6747, -40.927],
                    ],
                ],
                [
                    [
                        [-180, -40.9055],
                        [-178.2228, -40.7839],
                        [-178.2464, -40.6058],
                        [-180, -40.7255],
                        [-180, -40.9055],
                    ],
                ],
            ]);
        });
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
                4,
            );

            o(ans).deepEquals({
                type: 'Feature',
                geometry: {
                    type: 'MultiPolygon',
                    coordinates: [
                        [
                            [
                                [169.3378, -41.3809],
                                [180, -41.223],
                                [180, -30.908],
                                [169.7909, -31.0596],
                                [169.3378, -41.3809],
                            ],
                        ],
                        [
                            [
                                [-180, -41.223],
                                [-175.8429, -40.8954],
                                [-177.1978, -30.7264],
                                [-180, -30.908],
                                [-180, -41.223],
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
