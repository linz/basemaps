/** Convert to a a sorted query string or empty string if no query parameters are provided */
export function toQueryString(r: Record<string, string | null | undefined>): string {
  const entries = Object.entries(r);
  if (entries.length === 0) return '';

  const search = new URLSearchParams();
  for (const e of entries) {
    if (e[1] == null) continue;
    search.set(e[0], e[1]);
  }

  search.sort();

  const query = search.toString();
  if (query === '') return '';
  return `?${query}`;
}
