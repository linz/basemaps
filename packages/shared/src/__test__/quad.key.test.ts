import { QuadKey } from '../quad.key';

describe('QuadKey', () => {
    it('should intersect big to small', () => {
        expect(QuadKey.intersects('', '30003303')).toEqual(true);

        expect(QuadKey.intersects('3', '30')).toEqual(true);
        expect(QuadKey.intersects('3', '301')).toEqual(true);
        expect(QuadKey.intersects('3', '333')).toEqual(true);
        expect(QuadKey.intersects('33', '30')).toEqual(false);
        expect(QuadKey.intersects('33', '301')).toEqual(false);
        expect(QuadKey.intersects('33', '333')).toEqual(true);
    });

    it('should not intersect other cells', () => {
        expect(QuadKey.intersects('0', '30003303')).toEqual(false);
        expect(QuadKey.intersects('1', '30003303')).toEqual(false);
        expect(QuadKey.intersects('2', '30003303')).toEqual(false);
        expect(QuadKey.intersects('31', '30003303')).toEqual(false);
    });

    it('should intersect small to big', () => {
        expect(QuadKey.intersects('331', '3')).toEqual(true);
        expect(QuadKey.intersects('331', '30')).toEqual(false);
        expect(QuadKey.intersects('331', '301')).toEqual(false);
        expect(QuadKey.intersects('331', '333')).toEqual(false);
    });
});
