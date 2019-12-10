import { getProjection } from '../index';

function toFixed(f: number): string {
    return f.toFixed(6);
}

describe('Proj2193', () => {
    it('should convert to 2193', () => {
        const Proj2193 = getProjection(2193);
        if (Proj2193 == null) {
            throw new Error('Failed to init proj:2193');
        }
        const output = Proj2193.inverse([1180000.0, 4758000.0]);
        expect(output.map(toFixed)).toEqual([167.454458, -47.1970753].map(toFixed));

        const reverse = Proj2193.forward(output);
        expect(reverse.map(f => Math.floor(f))).toEqual([1180000.0, 4758000.0]);
    });
});
