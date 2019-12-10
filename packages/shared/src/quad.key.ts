export const QuadKey = {
    intersects(qkA: string, qkB: string): boolean {
        const shortestLength = Math.min(qkA.length, qkB.length);
        return qkA.substr(0, shortestLength) == qkB.substr(0, shortestLength);
    },
};
