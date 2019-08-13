/**
 * Extracts a named value from a query string but defaults to the key 'api' if none provided
 *
 * @param queryString query to extract from
 * @param key key to extract
 * @returns key value if exists, null otherwise
 */
export function queryStringExtractor(queryString: string, key: string = 'api'): string | null {
    if (queryString.startsWith('?')) {
        queryString = queryString.substring(1);
    }
    for (const keyPair of queryString.split('&')) {
        const keyAndPair: string[] = keyPair.split('=');
        if (keyAndPair[0] === key) {
            return keyAndPair[1];
        }
    }
    return null;
}
