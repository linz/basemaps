import { QuadKey } from '../quad.key';
import * as o from 'ospec';

o.spec('QuadKey', () => {
    o('should intersect big to small', () => {
        o(QuadKey.intersects('', '30003303')).equals(true);

        o(QuadKey.intersects('3', '30')).equals(true);
        o(QuadKey.intersects('3', '301')).equals(true);
        o(QuadKey.intersects('3', '333')).equals(true);
        o(QuadKey.intersects('33', '30')).equals(false);
        o(QuadKey.intersects('33', '301')).equals(false);
        o(QuadKey.intersects('33', '333')).equals(true);
    });

    o('should not intersect other cells', () => {
        o(QuadKey.intersects('0', '30003303')).equals(false);
        o(QuadKey.intersects('1', '30003303')).equals(false);
        o(QuadKey.intersects('2', '30003303')).equals(false);
        o(QuadKey.intersects('31', '30003303')).equals(false);
    });

    o('should intersect small to big', () => {
        o(QuadKey.intersects('331', '3')).equals(true);
        o(QuadKey.intersects('331', '30')).equals(false);
        o(QuadKey.intersects('331', '301')).equals(false);
        o(QuadKey.intersects('331', '333')).equals(false);
    });
});
