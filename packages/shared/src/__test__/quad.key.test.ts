import { QuadKey } from '../quad.key';

describe('QuadKey', () => {
    it('should intersect big to small', () => {
        expect(QuadKey.intersects('3', '30')).toEqual(true);
        expect(QuadKey.intersects('3', '301')).toEqual(true);
        expect(QuadKey.intersects('3', '333')).toEqual(true);
        expect(QuadKey.intersects('33', '30')).toEqual(false);
        expect(QuadKey.intersects('33', '301')).toEqual(false);
        expect(QuadKey.intersects('33', '333')).toEqual(true);
    });

    it('should intersect small to big', () => {
        expect(QuadKey.intersects('331', '3')).toEqual(true);
        expect(QuadKey.intersects('331', '30')).toEqual(false);
        expect(QuadKey.intersects('331', '301')).toEqual(false);
        expect(QuadKey.intersects('331', '333')).toEqual(false);
    });
});
