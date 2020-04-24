import { QuadKeyTrie } from '../quad.key.trie';
import * as o from 'ospec';
import { QuadKey } from '../quad.key';

o.spec('QuadKeyTrie', () => {
    function makeIndex(qk: string | string[]): QuadKeyTrie {
        const index = new QuadKeyTrie();
        if (Array.isArray(qk)) {
            qk.forEach((k) => index.add(k));
        } else {
            index.add(qk);
        }
        return index;
    }
    o.spec('intersect', () => {
        o('should intersect big to small', () => {
            o(makeIndex('').intersects('30')).equals(true);
            o(makeIndex('3').intersects('30')).equals(true);
            o(makeIndex('3').intersects('301')).equals(true);
            o(makeIndex('3').intersects('333')).equals(true);
            o(makeIndex('33').intersects('30')).equals(false);
            o(makeIndex('33').intersects('301')).equals(false);
            o(makeIndex('33').intersects('333')).equals(true);
        });

        o('should not intersect other cells', () => {
            o(makeIndex('0').intersects('30003303')).equals(false);
            o(makeIndex('1').intersects('30003303')).equals(false);
            o(makeIndex('2').intersects('30003303')).equals(false);
            o(makeIndex('31').intersects('30003303')).equals(false);
        });

        o('should intersect small to big', () => {
            o(makeIndex('331').intersects('3')).equals(true);
            o(makeIndex('331').intersects('30')).equals(false);
            o(makeIndex('331').intersects('301')).equals(false);
            o(makeIndex('331').intersects('333')).equals(false);
        });
    });
    o('should create a list', () => {
        o(makeIndex(QuadKey.children('31')).toList()).deepEquals(['310', '311', '312', '313']);
    });

    o('should remove unneeded keys', () => {
        o(makeIndex(['31', ...QuadKey.children('31')]).toList()).deepEquals(['31']);
    });
});
