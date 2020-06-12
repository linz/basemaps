/**
 * Make a function that rounds a number `n` to `z` decimal places.
 */
export function makeRound(z = 8): (n: number) => number {
    const p = 10 ** z;
    return (n: number): number => Math.round(n * p) / p;
}

/**
 * Round any thing. round any numbers found in `thing` to z decimal places
 */
export function round(thing: any, z = 8): any {
    const r = makeRound(z);
    const recurse = (obj: any): any => {
        if (typeof obj === 'number') {
            return r(obj);
        }
        if (typeof obj === 'string') {
            const n = +obj;
            if (isNaN(n)) return obj;
            return r(n).toString();
        }
        if (Array.isArray(obj)) {
            return obj.map(recurse);
        }
        if (obj == null || obj.constructor !== Object) return obj;

        const ans = Object.assign({}, obj);
        for (const key in ans) {
            ans[key] = recurse(ans[key]);
        }
        return ans;
    };
    return recurse(thing);
}
