const hostCache = new Map<string, string>();

export function getUrlHost(ref: string): string {
  let existing = hostCache.get(ref);
  if (existing == null) {
    existing = _getUrlHost(ref);
    hostCache.set(ref, existing);
  }
  return existing;
}
/** Extract the hostname from a url */
export function _getUrlHost(ref: string): string {
  if (ref == null) return 'unknown';
  if (ref === '-') return 'unknown';

  try {
    const { hostname } = new URL(ref);
    if (hostname == null) return ref;
    if (hostname.startsWith('www.')) return hostname.slice(4);
    return hostname;
  } catch (e) {
    if (!ref.startsWith('http')) return _getUrlHost('https://' + ref);
    // Ignore invalid referer hostname
    // eslint-disable-next-line no-console
    console.log(ref);
  }
  return 'unknown';
}
