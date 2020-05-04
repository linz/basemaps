import { QuadKeyTrie } from '../quad.key.trie';
import * as o from 'ospec';
import { QuadKey } from '../quad.key';

o.spec('QuadKeyTrie', () => {
    function makeIndex(qk: string | string[]): QuadKeyTrie {
        if (Array.isArray(qk)) {
            return QuadKeyTrie.fromList(qk);
        } else {
            const index = new QuadKeyTrie();
            index.add(qk);
            return index;
        }
    }

    o.spec('intersect', () => {
        o('should intersect big to small', () => {
            o(makeIndex('').intersectsKey('30')).equals(true);
            o(makeIndex('3').intersectsKey('30')).equals(true);
            o(makeIndex('3').intersectsKey('301')).equals(true);
            o(makeIndex('3').intersectsKey('333')).equals(true);
            o(makeIndex('33').intersectsKey('30')).equals(false);
            o(makeIndex('33').intersectsKey('301')).equals(false);
            o(makeIndex('33').intersectsKey('333')).equals(true);
        });

        o('should not intersect other cells', () => {
            o(makeIndex('0').intersectsKey('30003303')).equals(false);
            o(makeIndex('1').intersectsKey('30003303')).equals(false);
            o(makeIndex('2').intersectsKey('30003303')).equals(false);
            o(makeIndex('31').intersectsKey('30003303')).equals(false);
        });

        o('should intersect small to big', () => {
            o(makeIndex('331').intersectsKey('3')).equals(true);
            o(makeIndex('331').intersectsKey('30')).equals(false);
            o(makeIndex('331').intersectsKey('301')).equals(false);
            o(makeIndex('331').intersectsKey('333')).equals(false);
        });
    });

    o('should create a list', () => {
        o(Array.from(makeIndex(QuadKey.children('31')))).deepEquals(['310', '311', '312', '313']);
        o(Array.from(makeIndex(['000', '3120', '3122', '311']))).deepEquals(['000', '311', '3120', '3122']);
    });

    o('should remove unneeded keys', () => {
        o(Array.from(makeIndex(['31', ...QuadKey.children('31')]))).deepEquals(['31']);
    });

    o('iterators', () => {
        const trie = makeIndex(['0', '3113', '31131']);
        const list = Array.from(trie);
        o(list).deepEquals(['0', '3113']);
    });

    o('intersectingQuadKeys', () => {
        const trie = QuadKeyTrie.fromList(['2222', '2221']);
        o(Array.from(trie.intersectingQuadKeys('2'))).deepEquals(['2221', '2222']);
        o(Array.from(trie.intersectingQuadKeys('2222'))).deepEquals(['2222']);
        o(Array.from(trie.intersectingQuadKeys('222211230'))).deepEquals(['2222']);
        o(Array.from(trie.intersectingQuadKeys('2230'))).deepEquals([]);
    });

    o('intersection', () => {
        const trie1 = QuadKeyTrie.fromList(['2222', '2221', '31']);
        const trie2 = QuadKeyTrie.fromList(['3111', '3112', '22']);
        o(Array.from(trie1.intersection(trie2))).deepEquals(['2221', '2222', '3111', '3112']);
    });

    o.spec('mergeQuadKeys', () => {
        o('should not simplify if below percent', () => {
            const trie = QuadKeyTrie.fromList(QuadKey.children('3112').slice(1));
            const ans = trie.mergeQuadKeys(0.79, 4, 7);

            o(ans * (1 << 4)).equals(0.046875);
            o(Array.from(trie)).deepEquals(['31121', '31122', '31123']);
        });

        o('should simplify if node not too big and populated enough', () => {
            const trie = QuadKeyTrie.fromList(['311', '313', '31201', '31202']);
            const ans = trie.mergeQuadKeys(0.3, 4, 7);

            o(ans * (1 << 4)).equals(0.53125);
            o(Array.from(trie)).deepEquals(['311', '3120', '313']);
            o(trie.size).equals(3);
        });

        o('should not go below minZ', () => {
            const trie = QuadKeyTrie.fromList(QuadKey.children('3112').slice(1));
            const ans = trie.mergeQuadKeys(0.2, 5, 7);

            o(ans * (1 << 4)).equals(0.046875);
            o(Array.from(trie)).deepEquals(['31121', '31122', '31123']);
            o(trie.size).equals(3);
        });

        o('should not go above maxZ', () => {
            const trie = QuadKeyTrie.fromList(QuadKey.children('3112').slice(2));
            trie.add('3121112');
            trie.add('3121113');
            const ans = trie.mergeQuadKeys(0.8, 2, 4);

            o(ans * (1 << 4)).equals(0.033203125);
            o(Array.from(trie)).deepEquals(['3112', '312111']);
            o(trie.size).equals(2);
        });

        o('should give correct size', () => {
            const trie = QuadKeyTrie.fromList(['31112', '31113', '31101']);

            const ans = trie.mergeQuadKeys(1, 2, 2);

            o(ans).equals(0.0029296875);

            o(Array.from(trie)).deepEquals(['311']);
            o(trie.size).equals(1);
        });
    });
});
