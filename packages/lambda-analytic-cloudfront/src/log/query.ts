export interface QueryStringInfo {
  api: string;
  pipeline?: string;
}
function getQuery(str: string): QueryStringInfo {
  const urlSearch = new URLSearchParams(str);
  const api = _getApi(urlSearch);
  const pipeline = urlSearch.get('pipeline') ?? undefined;
  return { api, pipeline };
}

function _getApi(url: URLSearchParams): string {
  const api = url.get('api') ?? '';
  // api keys are 27 chars starting with d or c
  if (api.length !== 27) return 'invalid';
  if (api.startsWith('d')) return api;
  if (api.startsWith('c')) return api;
  return 'invalid';
}
const QueryMap = new Map<string, QueryStringInfo>();

export function parseQueryString(str: string): QueryStringInfo {
  let existing = QueryMap.get(str);
  if (existing == null) {
    existing = getQuery(str);
    QueryMap.set(str, existing);
  }
  // This can get very very large so periodically clear it
  if (QueryMap.size > 5_000_000) QueryMap.clear();
  return existing;
}
