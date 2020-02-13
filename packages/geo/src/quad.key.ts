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
};
