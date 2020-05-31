import * as o from 'ospec';
import { QuadTrie } from '../quad.trie';

o.spec('QuadTrie', () => {
    function makeIndex(qk: string | string[]): QuadTrie {
        if (Array.isArray(qk)) {
            return QuadTrie.fromList(qk);
        } else {
            const index = new QuadTrie();
            index.add(qk);
            return index;
        }
    }

    o.spec('intersectsTrie', () => {
        o('should intersect big to small', () => {
            o(makeIndex('').intersectsTrie(makeIndex('30'))).equals(true);
            o(makeIndex('3').intersectsTrie(makeIndex('30'))).equals(true);
            o(makeIndex('3').intersectsTrie(makeIndex('301'))).equals(true);
            o(makeIndex('3').intersectsTrie(makeIndex('333'))).equals(true);
            o(makeIndex('33').intersectsTrie(makeIndex('30'))).equals(false);
            o(makeIndex('33').intersectsTrie(makeIndex('301'))).equals(false);
            o(makeIndex('33').intersectsTrie(makeIndex('333'))).equals(true);
        });

        o('should not intersect other cells', () => {
            o(makeIndex('0').intersectsTrie(makeIndex('30003303'))).equals(false);
            o(makeIndex('1').intersectsTrie(makeIndex('30003303'))).equals(false);
            o(makeIndex('2').intersectsTrie(makeIndex('30003303'))).equals(false);
            o(makeIndex('31').intersectsTrie(makeIndex('30003303'))).equals(false);
        });

        o('should intersect small to big', () => {
            o(makeIndex('331').intersectsTrie(makeIndex('3'))).equals(true);
            o(makeIndex('331').intersectsTrie(makeIndex('30'))).equals(false);
            o(makeIndex('331').intersectsTrie(makeIndex('301'))).equals(false);
            o(makeIndex('331').intersectsTrie(makeIndex('333'))).equals(false);
        });
    });

    o('should remove unneeded keys', () => {
        o(Array.from(makeIndex(['31', '311']))).deepEquals(['31']);
    });

    o('iterators', () => {
        const trie = makeIndex(['0', '3113', '31131']);
        const list = Array.from(trie);
        o(list).deepEquals(['0', '3113']);
    });

    o('intersection with key', () => {
        const trie = QuadTrie.fromList(['2222', '2221']);

        const intQK = (k: string): string[] => Array.from(trie.clone().intersection(QuadTrie.fromList([k])));

        o(intQK('222211230')).deepEquals(['222211230']);
        o(intQK('2222')).deepEquals(['2222']);
        o(intQK('2')).deepEquals(['2221', '2222']);
        o(intQK('2230')).deepEquals([]);
        const itrie = new QuadTrie();
        o(trie.clone().intersection(itrie).size).equals(0);
        itrie.intersection(trie);
        o(itrie.size).equals(0);
    });

    o('intersection', () => {
        const trie1 = QuadTrie.fromList(['2222', '2221', '31']);
        const trie2 = QuadTrie.fromList(['3111', '3112', '22']);
        o(Array.from(trie1.clone().intersection(trie2))).deepEquals(['2221', '2222', '3111', '3112']);
        o(Array.from(trie2.intersection(trie1))).deepEquals(['2221', '2222', '3111', '3112']);
        o(Array.from(trie2)).deepEquals(['2221', '2222', '3111', '3112']);
    });

    o('nested intersection', () => {
        const trie1 = QuadTrie.fromList(['2211', '22132', '331']);
        const trie2 = QuadTrie.fromList(['3313', '2212', '22131']);

        const ans = trie1.clone().intersection(trie2);
        o(Array.from(ans)).deepEquals(['3313']);
        o(ans.size).equals(1);
        o((ans as any).nodes[0]).equals(10); // should delete node

        o(Array.from(trie2.intersection(trie1))).deepEquals(['3313']);
        o(trie2.size).equals(1);
        o((trie2 as any).nodes[0]).equals(18); // should delete node
    });

    o.spec('union', () => {
        o('empty A', () => {
            const trie = new QuadTrie();
            o(Array.from(trie.union(new QuadTrie()))).deepEquals([]);
            o(trie.size).equals(0);

            o(Array.from(trie.union(QuadTrie.fromList([''])))).deepEquals(['']);
            trie.clear();

            o(Array.from(trie.union(QuadTrie.fromList(['31', '32'])))).deepEquals(['31', '32']);
        });

        o('full B', () => {
            const trie = QuadTrie.fromList(['3', '21']);
            o(Array.from(trie.union(QuadTrie.fromList([''])))).deepEquals(['']);
        });

        o('top', () => {
            const trie = QuadTrie.fromList(['']);
            const trie2 = QuadTrie.fromList(['31']);
            o(Array.from(trie.union(trie2))).deepEquals(['']);
            o(trie.size).equals(1);

            trie.clear();
            o(Array.from(trie2)).deepEquals(['31']);
            trie.union(QuadTrie.fromList(['0', '1', '2', '30', '32', '33']));
            o(Array.from(trie.union(trie2))).deepEquals(['']);
            o(trie.size).equals(1);
        });

        o('simple', () => {
            const trie1 = QuadTrie.fromList(['31']);
            const trie2 = QuadTrie.fromList(['32']);
            o(Array.from(trie1.union(trie2))).deepEquals(['31', '32']);
        });

        o('complex', () => {
            const trie1 = QuadTrie.fromList(['2222', '2221', '012', '02', '31', '30', '110', '113']);
            const trie2 = QuadTrie.fromList(['3111', '3112', '011', '031', '22', '111', '112']);

            trie1.union(trie2);
            o(Array.from(trie1)).deepEquals(['011', '012', '02', '031', '11', '22', '30', '31']);
        });
    });

    o('add over child', () => {
        const trie = QuadTrie.fromList(['31112', '31113', '311011']);

        trie.add('31101');
        trie.add('311021');

        o(Array.from(trie)).deepEquals(['31101', '311021', '31112', '31113']);
        o(trie.size).equals(4);
    });

    o('add top level', () => {
        const trie = new QuadTrie();

        trie.add('');
        o(trie.size).equals(1);
        trie.add('1');
        o(trie.size).equals(1);
        o(Array.from(trie)).deepEquals(['']);

        trie.clear();
        trie.add('0');
        trie.add('3');
        o(trie.size).equals(2);
        o(Array.from(trie)).deepEquals(['0', '3']);

        trie.clear();
        o(trie.size).equals(0);
        o(Array.from(trie)).deepEquals([]);

        trie.add('0');
        trie.add('3');
        o(Array.from(trie)).deepEquals(['0', '3']);
        o(trie.size).equals(2);

        trie.add('2');
        trie.add('3');
        trie.add('1');

        o(Array.from(trie)).deepEquals(['0', '1', '2', '3']);
        o(trie.size).equals(4);
    });

    o('add', () => {
        const trie = new QuadTrie();

        trie.add('30');
        trie.add('31');
        trie.add('32');
        trie.add('33');
        trie.add('33');

        o(Array.from(trie)).deepEquals(['30', '31', '32', '33']);
    });

    o('fillRow simple', () => {
        const trie = new QuadTrie();
        trie.clear();
        trie.fillRow(0, 0, 0, 0);
        o(Array.from(trie)).deepEquals(['']);
        o(trie.size).equals(1);
        trie.fillRow(0, 0, 0, 1);
        o(Array.from(trie)).deepEquals(['']);
        o(trie.size).equals(1);

        trie.clear();
        trie.fillRow(0, 0, 0, 1);
        o(Array.from(trie)).deepEquals(['2']);
        o(trie.size).equals(1);

        trie.fillRow(0, 1, 1, 1);
        o(Array.from(trie)).deepEquals(['0', '1', '2']);
        o(trie.size).equals(3);

        trie.fillRow(1, 1, 0, 1);
        o(Array.from(trie)).deepEquals(['']);
        o(trie.size).equals(1);
    });

    o('fillRow complex', () => {
        const trie = new QuadTrie();
        for (let i = 0; i < 10; ++i) {
            trie.fillRow(0, 9, i, 10);
        }
        const trie2 = new QuadTrie();
        for (let i = 2; i < 12; ++i) {
            trie2.fillRow(1 + (i >> 2), 5 + i, i, 10);
        }

        trie2.intersection(trie);

        o(Array.from(trie2)).deepEquals([
            '2222220231',
            '2222220233',
            '222222032',
            '222222033',
            '222222122',
            '222222201',
            '222222203',
            '22222221',
            '2222222201',
            '2222222203',
            '222222221',
            '222222230',
            '222222231',
            '222222300',
            '222222302',
            '2222223200',
        ]);
    });

    o('fillRow minSize', () => {
        const trie = new QuadTrie();
        trie.clear();
        trie.fillRow(0, 1, 1, 2);
        trie.fillRow(0, 3, 0, 2);
        o(Array.from(trie)).deepEquals(['2', '32', '33']);
        o(trie.size).equals(3);

        trie.clear();
        trie.fillRow(0, 1, 1, 3);
        trie.add('223');
        trie.fillRow(0, 3, 0, 3);
        o(Array.from(trie)).deepEquals(['22', '232', '233']);
        o(trie.size).equals(3);

        trie.clear();
        trie.fillRow(0, 1, 1, 3);
        trie.add('2221');
        trie.fillRow(1, 3, 0, 3);
        o(Array.from(trie)).deepEquals(['220', '221', '2221', '223', '232', '233']);
        o(trie.size).equals(6);
    });

    o('clone', () => {
        const trie1 = new QuadTrie();
        trie1.fillRow(1, 2, 0, 2);
        const trie2 = trie1.clone();
        trie1.clear();
        o(Array.from(trie1)).deepEquals([]);
        o(Array.from(trie2)).deepEquals(['23', '32']);
        o(trie2.size).equals(2);
    });

    o('fillRow', () => {
        const trie = new QuadTrie();
        trie.clear();
        trie.add('0032123');
        trie.fillRow(700, 710, 3208, 12);
        o(Array.from(trie)).deepEquals([
            '0032123',
            '003213220222',
            '003213220223',
            '003213220232',
            '003213220233',
            '003213220322',
            '003213220323',
            '003213220332',
        ]);
        o(trie.size).equals(8);

        trie.clear();
        trie.add('23');
        trie.add('32');
        trie.fillRow(0, 7, 1, 3);
        o(Array.from(trie)).deepEquals(['220', '221', '23', '32', '330', '331']);
        o(trie.size).equals(6);

        trie.clear();
        trie.fillRow(0, 8, 0, 3);
        o(trie.size).equals(8);

        trie.clear();
        trie.add('2');
        trie.fillRow(0, 3, 1, 2);
        o(Array.from(trie)).deepEquals(['2', '30', '31']);
        o(trie.size).equals(3);

        trie.fillRow(0, 1, 0, 1);
        o(Array.from(trie)).deepEquals(['2', '3']);

        trie.clear();
        trie.fillRow(2, 3, 2, 3);
        o(Array.from(trie)).deepEquals(['212', '213']);

        trie.clear();
        trie.fillRow(1032692, 1032693, 393208, 20);
        o(Array.from(trie)).deepEquals(['31311100000111110322', '31311100000111110323']);

        trie.clear();
        trie.fillRow(2, 2, 2, 3);
        o(Array.from(trie)).deepEquals(['212']);

        trie.clear();
        trie.fillRow(0, 20, 10, 5);
        o(Array.from(trie)).deepEquals([
            '20202',
            '20203',
            '20212',
            '20213',
            '20302',
            '20303',
            '20312',
            '20313',
            '21202',
            '21203',
            '21212',
            '21213',
            '21302',
            '21303',
            '21312',
            '21313',
            '30202',
            '30203',
            '30212',
            '30213',
            '30302',
        ]);

        trie.clear();
        trie.add('0032123');
        trie.fillRow(700, 702, 3208, 12);
        o(Array.from(trie)).deepEquals(['0032123']);
        o(trie.size).equals(1);

        trie.clear();
        trie.add('2311');
        trie.fillRow(0, 5, 1, 3);
        o(Array.from(trie)).deepEquals(['220', '221', '230', '231', '320', '321']);
        o(trie.size).equals(6);

        trie.clear();
        trie.add('0032123');
        trie.fillRow(670, 705, 3208, 12);
        o(Array.from(trie)).deepEquals(['003212231332', '003212231333', '0032123', '003213220222', '003213220223']);
    });

    o.spec('mergeQuadKeys', () => {
        o('should not simplify if below percent', () => {
            const trie = QuadTrie.fromList(['31121', '31122', '31123']);
            const ans = trie.mergeTiles(4, 7, 0.79);

            o(ans * (1 << 4)).equals(0.046875);
            o(Array.from(trie)).deepEquals(['31121', '31122', '31123']);
        });

        o('should simplify if node not too big and populated enough', () => {
            const trie = QuadTrie.fromList(['311', '313', '31201', '31202']);
            const ans = trie.mergeTiles(4, 7, 0.3);

            o(ans * (1 << 4)).equals(0.53125);
            o(Array.from(trie).join(',')).equals('3110,3111,3112,3113,3120,3130,3131,3132,3133');
            o(trie.size).equals(9);
        });

        o('should not go below minZ', () => {
            const trie = QuadTrie.fromList(['31121', '31122', '31123']);
            const ans = trie.mergeTiles(5, 7, 0.2);

            o(ans * (1 << 4)).equals(0.046875);
            o(Array.from(trie)).deepEquals(['31121', '31122', '31123']);
            o(trie.size).equals(3);
        });

        o('should not go above maxZ', () => {
            const trie = QuadTrie.fromList(['31122', '31123']);
            trie.add('3121112');
            trie.add('3121113');
            const ans = trie.mergeTiles(2, 4, 0.8);

            o(ans * (1 << 4)).equals(0.033203125);
            o(Array.from(trie)).deepEquals(['3112', '312111']);
            o(trie.size).equals(2);
        });

        o('should give correct size', () => {
            const trie = QuadTrie.fromList(['31112', '31113', '31101']);

            const ans = trie.mergeTiles(2, 2, 1);

            o(ans).equals(0.0029296875);

            o(Array.from(trie)).deepEquals(['311']);
            o(trie.size).equals(1);
        });

        o('should expand tiles too big', () => {
            const trie = QuadTrie.fromList(['']);
            o(Array.from(trie)).deepEquals(['']);

            trie.mergeTiles(1);
            o(trie.size).equals(4);
            o(Array.from(trie)).deepEquals(['0', '1', '2', '3']);

            trie.mergeTiles(2);
            o(trie.size).equals(16);
            o(Array.from(trie).join('')).equals('00010203101112132021222330313233');

            trie.clear();
            trie.add('3120');
            trie.add('311111');
            trie.add('311112');
            trie.mergeTiles(5, 10);
            o(Array.from(trie)).deepEquals(['311111', '311112', '31200', '31201', '31202', '31203']);
            o(trie.size).equals(6);
        });
    });
});
