import { QuadKey } from '../quad.key';
import * as o from 'ospec';

o.spec('QuadKey', () => {
    o.spec('intersect', () => {
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

    o('should get children', () => {
        o(QuadKey.children('')).deepEquals(['0', '1', '2', '3']);
        o(QuadKey.children('3')).deepEquals(['30', '31', '32', '33']);
        o(QuadKey.children('3001')).deepEquals(['30010', '30011', '30012', '30013']);
    });

    o('should find parent', () => {
        o(QuadKey.parent('')).equals('');
        o(QuadKey.parent('3')).equals('');
        o(QuadKey.parent('31')).equals('3');
        o(QuadKey.parent('3001')).equals('300');
    });

    o.spec('simplify', () => {
        o('should simplify children', () => {
            o(QuadKey.simplify(QuadKey.children('31'))).deepEquals(['31']);
        });

        o('should not simplify incomplete groups', () => {
            o(QuadKey.simplify(['0', '1', '2'])).deepEquals(['0', '1', '2']);
        });

        o('should remove duplicates', () => {
            o(QuadKey.simplify(['0', '0', '0'])).deepEquals(['0']);
            o(QuadKey.simplify(['0', '000', '000', '0001'])).deepEquals(['0']);
            o(QuadKey.simplify(['0', '0', '0', '0000001'])).deepEquals(['0']);
            o(QuadKey.simplify(['0', '0', '0', '1'])).deepEquals(['0', '1']);
            o(QuadKey.simplify(['0', '031231', '00001', '1', '1000', '10001', '1000000'])).deepEquals(['0', '1']);
        });

        o('should node simplify complete groups', () => {
            // TODO this is not goode behaviour, this should really deep equal `''`
            o(QuadKey.simplify(['0', '1', '2', ...QuadKey.children('3')])).deepEquals(['0', '1', '2', '3']);
        });
    });

    o.spec('covering percent', () => {
        o('should calculate covering', () => {
            o(QuadKey.coveringPercent('', ['3'])).equals(1 / 4);
            o(QuadKey.coveringPercent('', ['3', '2'])).equals(2 / 4);
            o(QuadKey.coveringPercent('', ['3', '2', '1'])).equals(3 / 4);
            o(QuadKey.coveringPercent('', ['3', '2', '1', '0'])).equals(1);

            o(QuadKey.coveringPercent('3', ['3'])).equals(1);
            o(QuadKey.coveringPercent('3', ['30'])).equals(1 / 4);
            o(QuadKey.coveringPercent('3', ['300'])).equals(1 / 16);
            o(QuadKey.coveringPercent('3', ['3000'])).equals(1 / 64);
        });

        o('should cover from children', () => {
            o(QuadKey.coveringPercent('3', QuadKey.children('3'))).equals(1);
            o(QuadKey.coveringPercent('31', QuadKey.children('31'))).equals(1);
            o(QuadKey.coveringPercent('310', QuadKey.children('310'))).equals(1);
            o(QuadKey.coveringPercent('3101', QuadKey.children('3101'))).equals(1);
            o(QuadKey.coveringPercent('31000', QuadKey.children('31000'))).equals(1);
        });

        o('should ignore outside bounds', () => {
            o(QuadKey.coveringPercent('3', QuadKey.children('1'))).equals(0);
            o(QuadKey.coveringPercent('3', QuadKey.children('1111'))).equals(0);
        });
    });
});
