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
export function round<T>(thing: T, z = 8): T {
  const r = makeRound(z);
  const recurse = (obj: unknown): unknown => {
    if (typeof obj === 'number') {
      return r(obj);
    }
    if (typeof obj === 'string') {
      const n = Number(obj);
      if (isNaN(n)) return obj;
      return r(n).toString();
    }
    if (Array.isArray(obj)) {
      return obj.map(recurse);
    }
    if (obj == null || obj.constructor !== Object) return obj;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const ans = Object.assign({}, obj) as any;
    for (const key in ans) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ans[key] = recurse(ans[key]);
    }
    return ans;
  };
  return recurse(thing) as T;
}

/**
 * Format a number to no more than z decimal places
 */
export function toRoundedString(d: number, z = 8): string {
  return d.toFixed(z).replace(/\.?0+$/, '');
}

/**
 * Search string for numbers with decimal points and replace them with rounded numbers to z decimal places.
 */
export function roundNumbersInString(str: string, z = 8): string {
  return str.replace(/\d+\.\d+/g, (d) => toRoundedString(Number.parseFloat(d), z));
}
