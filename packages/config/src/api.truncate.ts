/** Truncate a API key to the last 6 digits */
export function truncateApiKey(x: unknown): string | undefined {
  if (typeof x !== 'string') return 'invalid';
  if (x.startsWith('c')) return 'c' + x.slice(x.length - 6);
  if (x.startsWith('d')) return 'd' + x.slice(x.length - 6);
  return 'invalid';
}
