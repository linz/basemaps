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
        o(makeIndex(['000', '3120', '3122', '311']).toList()).deepEquals(['000', '311', '3120', '3122']);
    });

    o('should remove unneeded keys', () => {
        o(makeIndex(['31', ...QuadKey.children('31')]).toList()).deepEquals(['31']);
    });

    o('iterators', () => {
        const trie = makeIndex(['0', '3113', '31131']);
        const list = Array.from(trie);
        o(list).deepEquals(['0', '3113']);
    });

    o('nodes', () => {
        o(Array.from(new QuadKeyTrie().nodes())).deepEquals([]);
        o(Array.from(makeIndex('31').nodes())).deepEquals([['31', {}]] as any);

        const trie = makeIndex(['0', '3113', '31131']);

        const node = trie.get('3113') as any;
        node.foo = 'bar';
        o(Array.from(trie.nodes()).map(([s]) => s)).deepEquals(['0', '3113', '31131']);
        o(Array.from(trie.nodes(undefined, false))).deepEquals([
            ['0', {}],
            ['3113', { foo: 'bar', '1': {} }],
        ] as any);
        o(Array.from(trie.nodes(node, true))).deepEquals([
            ['', { foo: 'bar', '1': {} }],
            ['1', {}],
        ] as any);
    });
});
