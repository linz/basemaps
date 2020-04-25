import { QuadKeyTrie } from './quad.key.trie';

/** Percentage of the world covered by a quadkey at zoom level z */
const ResolutionInverse = new Array(32).fill(32).map((c, i) => 1 / 4 ** i);

export const QuadKey = {
    Keys: ['0', '1', '2', '3'],
    /**
     * Simple intersection of quad keys
     * @param qkA QuadKey A
     * @param qkB QuadKey B
     * @returns whether qkA intersects qkB
     */
    intersects(qkA: string, qkB: string): boolean {
        const shortestLength = Math.min(qkA.length, qkB.length);
        return qkA.substr(0, shortestLength) == qkB.substr(0, shortestLength);
    },

    /**
     * Get the quadkey's children
     * @example
     * '3' -> ['30', '31', '32', '33']
     *
     * @param qk
     */
    children(qk: string): string[] {
        return QuadKey.Keys.map((c) => qk + c);
    },

    /**
     * Get the parent quadkey for the quadkey
     *
     * @example
     * `31` -> `3`
     * @param qk
     */
    parent(qk: string): string {
        return qk.substr(0, qk.length - 1);
    },

    /**
     * Find duplicate quadkeys and remove them while simplifying groupings
     *
     * @param quadKeys
     */
    simplify(quadKeys: string[]): string[] {
        const index = new QuadKeyTrie();
        for (const qk of quadKeys) {
            const currentSize = index.size;
            const node = index.add(qk);
            // Node was a duplicate so ignore
            if (currentSize == index.size) continue;

            // Check if the quad key can collapse down
            let parentNode = QuadKeyTrie.parent(node);
            let parentQk = QuadKey.parent(qk);
            while (parentNode != null) {
                let count = 0;
                for (const key of QuadKey.Keys) {
                    if (QuadKeyTrie.has(parentNode, key)) count++;
                }

                if (count != 4) break;

                index.add(parentQk);
                parentNode = QuadKeyTrie.parent(parentNode);
                parentQk = QuadKey.parent(parentQk);
            }
        }

        return index.toList();
    },

    /**
     * Compare quadkeys such that using with sort will result in a list from Biggest coverage to smallest.
     * @param a
     * @param b
     * @retun < 0, = 0 or > 0
     */
    compareKeys(a: string, b: string): number {
        return a == b ? 0 : a.length == b.length ? (a < b ? -1 : 1) : a.length - b.length;
    },

    /**
     * calculate the covering percentage of a quadkey from other quadkeys
     *
     * @param rootQuadKey the root quadkey to check
     * @param quadKeys list of quadkeys to check against
     */
    coveringPercent(rootQuadKey: string, quadKeys: string[]): number {
        let percent = 0;

        const applied = new QuadKeyTrie();
        const sortedNodes = quadKeys.slice().sort(QuadKey.compareKeys);

        for (const qk of sortedNodes) {
            /** Not intersecting */
            if (!QuadKey.intersects(rootQuadKey, qk)) continue;

            const resolutionDiff = qk.length - rootQuadKey.length;
            /** This qk is bigger than the root qk, so its fully covered */
            if (resolutionDiff == 0) return 1;

            /** Ignore child nodes eg `31` means `313` is ignored */
            if (applied.intersects(qk)) continue;
            applied.add(qk);

            percent += ResolutionInverse[resolutionDiff];
        }

        return percent;
    },
};
