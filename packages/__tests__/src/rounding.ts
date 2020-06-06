export function round(z = 8): (n: number) => number {
    const p = 10 ** z;
    return (n: number): number => Math.round(n * p) / p;
}

export function roundJson(json: any, z = 8): any {
    const r = round(z);
    const recurse = (obj: any): any => {
        if (typeof obj === 'number') {
            return r(obj);
        }
        if (Array.isArray(obj)) {
            return obj.map(recurse);
        }
        if (obj == null || typeof obj !== 'object') return obj;

        const ans = Object.assign({}, obj);
        for (const key in ans) {
            ans[key] = recurse(ans[key]);
        }
        return ans;
    };
    return recurse(json);
}
