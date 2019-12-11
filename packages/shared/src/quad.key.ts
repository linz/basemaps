export const QuadKey = {
    /**
     * Simple intersection of quad keys
     * @param qkA QuadKey A
     * @param qkB QuadKey B
     * @returns whether qkA intersects qkB
     */
    intersects(qkA: string, qkB: string): boolean {
        // Everything intersects with the root tile
        if (qkA == '0' || qkB == '0') {
            return true;
        }
        const shortestLength = Math.min(qkA.length, qkB.length);
        return qkA.substr(0, shortestLength) == qkB.substr(0, shortestLength);
    },
};
