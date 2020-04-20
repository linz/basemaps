import { Bounds, EPSG } from '@basemaps/geo';
import * as Mercator from 'global-mercator';
import * as o from 'ospec';
import { getProjection, projectBBox, quadKeyToBounds } from '../index';

function toFixed(f: number): string {
    return f.toFixed(6);
}

function assertNear(a: number, b: number, esp = 1e-4): void {
    if (Math.abs(b - a) < esp) o(true).equals(true);
    else o(a).equals(b);
}

function assertBounds(b: Bounds, bbox: Mercator.BBox, esp = 1e-4): void {
    const exp = Bounds.fromBbox(bbox);
    assertNear(b.x, exp.x, esp);
    assertNear(b.y, exp.y, esp);
    assertNear(b.width, exp.width, esp);
    assertNear(b.height, exp.height, esp);
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

    o('quadKeyToBBox', () => {
        assertBounds(quadKeyToBounds(''), [-180, -85.051129, 180, 85.051129]);
        assertBounds(quadKeyToBounds('3113323113203'), [174.067383, -39.300299, 174.111328, -39.266284]);
        assertBounds(quadKeyToBounds('3', EPSG.Wgs84), [0, -85.051129, 180, 0]);
        assertBounds(quadKeyToBounds('3113323113203', EPSG.Google), [
            19377092.439277727,
            -4764778.568406294,
            19381984.374300633,
            -4759886.56467882,
        ]);
        assertBounds(quadKeyToBounds('3113323113203', EPSG.Nztm), [
            1692080.1991254836,
            5649309.391300598,
            1695824.9409838915,
            5653130.02547132,
        ]);

        assertBounds(quadKeyToBounds('3131110001', EPSG.Nztm), [
            1745253.8195637646,
            5431987.946599266,
            1774130.391815818,
            5462038.971534497,
        ]);
    });

    o('projectBBox', () => {
        o(projectBBox([1, 2, 3, 4])).deepEquals([1, 2, 3, 4]);
        o(projectBBox([174, -40, 175, -41], undefined, EPSG.Google)).deepEquals([
            19369591.3980296,
            -4865942.279503176,
            19480910.888822876,
            -5012341.663847517,
        ]);
        o(
            projectBBox(
                [19369591.3980296, -4865942.279503176, 19480910.888822876, -5012341.663847517],
                EPSG.Google,
            ).map((n) => Math.round(n * 1000) / 1000),
        ).deepEquals([174, -40, 175, -41]);

        o(
            projectBBox(
                [19369591.3980296, -4865942.279503176, 19480910.888822876, -5012341.663847517],
                EPSG.Google,
                EPSG.Nztm,
            ).map((n) => Math.round(n * 1000) / 1000),
        ).deepEquals([1684102.134, 5570327.027, 1770725.494, 5460761.411]);
    });
});
