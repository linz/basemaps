/** Percentage of the world covered by a quadkey at zoom level z */
const ResolutionInverse = new Array(32).fill(32).map((c, i) => 1 / 4 ** i);

/**
 * Does any of this quad key's parents exist in the set
 * @param quadKeys Set to check
 * @param qk quadkey to check
 */
function hasParent(quadKeys: Set<string>, qk: string): boolean {
    while (qk.length > 0) {
        if (quadKeys.has(qk)) return true;
        qk = qk.substr(0, qk.length - 1);
    }
    return false;
}

export const QuadKey = {
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
        return ['0', '1', '2', '3'].map((c) => qk + c);
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
     * TODO is there a faster way to do this
     *
     * @param quadKeys
     */
    simplify(quadKeys: string[]): string[] {
        const output = new Set<string>();
        const counter = new Map<string, number>();

        for (const qk of quadKeys) {
            if (output.has(qk)) continue;
            if (hasParent(output, qk)) continue;

            const parent = QuadKey.parent(qk);
            const existing = counter.get(parent) ?? 0;
            counter.set(parent, existing + 1);
            if (existing < 3) {
                output.add(qk);
            } else if (existing == 3) {
                for (const child of QuadKey.children(parent)) output.delete(child);
                output.add(parent);
                /**
                 * TODO recurse upwards if this new quadkey fills it's parent's qk
                 * eg if this adds `3` and `0`,`1`,`2` already exist, this should squash those down.
                 */
            }
        }

        return [...output.keys()];
    },

    /**
     * calculate the covering percentage of a quadkey from other quadkeys
     *
     * @param rootQuadKey the root quadkey to check
     * @param quadKeys list of quadkeys to check against
     */
    coveringPercent(rootQuadKey: string, quadKeys: string[]): number {
        let percent = 0;

        const sortedNodes = quadKeys.slice().sort((a, b) => a.length - b.length);

        const applied: Set<string> = new Set();
        for (const qk of sortedNodes) {
            /** Not intersecting */
            if (!QuadKey.intersects(rootQuadKey, qk)) continue;

            const resolutionDiff = qk.length - rootQuadKey.length;
            /** This qk is bigger than the root qk, so its fully covered */
            if (resolutionDiff == 0) return 1;

            // TODO is there a faster way of doing this? This could also assume that `simplify` is called first
            /** Ignore child nodes eg `31` means `313` is ignored */
            if (hasParent(applied, qk)) continue;
            applied.add(qk);

            percent += ResolutionInverse[resolutionDiff];
        }

        return percent;
    },
};
