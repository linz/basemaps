import * as o from 'ospec';
import { getProjection, Wgs84ToGoogle } from '../index';

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

    o('Wgs84ToGoogle', () => {
        o(Wgs84ToGoogle.forward([167.454458, -47.1970753])).deepEquals([18640944.995623615, -5974301.313247106]);
    });
});
