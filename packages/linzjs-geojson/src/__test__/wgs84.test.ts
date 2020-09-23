import { round } from '@basemaps/test/build/rounding';
import o from 'ospec';
import { Wgs84 } from '../wgs84';
import { BBox, Ring } from '../types';

o.spec('wgs84', () => {
    o('normLon', () => {
        o(round(Wgs84.normLon(-163.12345 - 720))).equals(-163.12345);
        o(round(Wgs84.normLon(-183.12345 - 720))).equals(176.87655);
        o(round(Wgs84.normLon(-163.12345))).equals(-163.12345);
        o(round(Wgs84.normLon(184.12345))).equals(-175.87655);
        o(round(Wgs84.normLon(184.12345 + 720))).equals(-175.87655);
        o(round(Wgs84.normLon(174.12345 + 720))).equals(174.12345);
    });

    o('crossesAM', () => {
        o(Wgs84.crossesAM(-5, 5)).equals(false);
        o(Wgs84.crossesAM(80, -100)).equals(false);
        o(Wgs84.crossesAM(-175, 175)).equals(true);
        o(Wgs84.crossesAM(175, -175)).equals(true);
    });

    o('delta', () => {
        o(Wgs84.delta(170, -175)).equals(15);
        o(Wgs84.delta(-175, 170)).equals(-15);

        o(Wgs84.delta(20, 30)).equals(10);
        o(Wgs84.delta(30, 20)).equals(-10);

        o(Wgs84.delta(-10, 20)).equals(30);
        o(Wgs84.delta(20, -10)).equals(-30);
    });

    o('union', () => {
        const across: BBox = [175, -42, -178, -41];
        const after: BBox = [-170, -43, -160, -42];
        const before1: BBox = [170, 40, 178, 42];
        const before2: BBox = [160, 43, 171, 46];

        o(round(Wgs84.union(across, after), 4)).deepEquals([175, -43, -160, -41]);
        o(round(Wgs84.union(after, across), 4)).deepEquals([175, -43, -160, -41]);
        o(round(Wgs84.union(before1, before2), 4)).deepEquals([160, 40, 178, 46]);

        const unionLon = (aw: number, ae: number, bw: number, be: number): number[] =>
            round(Wgs84.union([aw, -42, ae, -40], [bw, -42, be, -40]), 4);

        // disjoint east closer
        o(unionLon(90, 100, -100, -90)).deepEquals([90, -42, -90, -40]);
        // disjoint west closer
        o(unionLon(80, 90, -90, -80)).deepEquals([-90, -42, 90, -40]);
    });

    o('intersects', () => {
        o(
            Wgs84.intersects(
                [171.16132716263337, -41.92299193831797, 179.6866432373672, -36.636815652203964],
                [-179.99999999999963, -85.05112877980652, 179.9999999999992, 85.05112877980656],
            ),
        ).equals(true);

        o(
            Wgs84.intersects(
                [-179.99999999999963, -85.05112877980652, 179.9999999999992, 85.05112877980656],
                [-172.0800290863167, -48.5745837865672, -153.8906979748706, -38.00169088003005],
            ),
        ).equals(true);

        o(
            Wgs84.intersects(
                [-172.0800290863167, -48.5745837865672, -153.8906979748706, -38.00169088003005],
                [-179.99999999999963, -85.05112877980652, 179.9999999999992, 85.05112877980656],
            ),
        ).equals(true);

        o(Wgs84.intersects([10, -10, 20, 10], [10, -10, 20, 10])).equals(true);
        o(Wgs84.intersects([10, -10, 20, 10], [10, 11, 20, 20])).equals(false);
        o(Wgs84.intersects([10, -10, 20, 10], [30, -10, 40, 10])).equals(false);
        o(Wgs84.intersects([10, -10, 20, 10], [0, -10, 40, 10])).equals(true);
        o(Wgs84.intersects([170, -10, -120, 10], [-150, -10, -120, 10])).equals(true);
        o(Wgs84.intersects([170, -10, -170, 10], [-160, -10, -120, 10])).equals(false);

        o(Wgs84.intersects([-150, -10, -120, 10], [170, -10, -120, 10])).equals(true);
        o(Wgs84.intersects([-160, -10, -120, 10], [170, -10, -170, 10])).equals(false);
    });

    o('ringToBbox', () => {
        const ring: Ring = [
            [170, -41],
            [-175, -40],
            [-177, -42],
            [175, -42],
            [170, -41],
        ];
        o(Wgs84.ringToBbox(ring)).deepEquals([170, -42, -175, -40]);
    });

    o('multiPolygonToBbox', () => {
        const ring1: Ring = [
            [170, -41],
            [160, -42],
            [170, -42],
            [170, -41],
        ];
        const ring2: Ring = [
            [-150, -40],
            [-140, -41],
            [-150, -41],
            [-150, -40],
        ];
        o(Wgs84.multiPolygonToBbox([[ring1], [ring2]])).deepEquals([160, -42, -140, -40]);
    });

    o('bboxToMultiPolygon', () => {
        o(Wgs84.bboxToMultiPolygon([160, -42, 178, -40])).deepEquals([
            [
                [
                    [160, -42],
                    [160, -40],
                    [178, -40],
                    [178, -42],
                    [160, -42],
                ],
            ],
        ]);
        o(Wgs84.bboxToMultiPolygon([160, -42, -140, -40])).deepEquals([
            [
                [
                    [160, -42],
                    [160, -40],
                    [180, -40],
                    [180, -42],
                    [160, -42],
                ],
            ],
            [
                [
                    [-140, -40],
                    [-140, -42],
                    [-180, -42],
                    [-180, -40],
                    [-140, -40],
                ],
            ],
        ]);
    });
});
