import { Const } from '../../shared/src/const';
//TODO get @shared to work

/**
 * Checks key name against allowed list of acceptable values
 *
 * @param keyString parameter key string to validate
 * @returns true if key name is valid and false if its not
 */
export function validateQueryParameters(keyString: string) : boolean {
    return (Const.QueryParameters.AllowedKeys
                .map((val:string) => (new RegExp(val)).test(keyString)))
                .reduce((orSum:boolean, inc:boolean) => orSum||inc);
}


/**
 * Extracts a named value from a query string but defaults to the key 'api' if none provided
 *
 * @param queryString query to extract from
 * @param key key to extract
 * @returns key value if exists, null otherwise
 */
export function queryStringExtractor(queryString: string, key: string = Const.ApiKey.QueryString): string | null {
    if (queryString.startsWith('?')) {
        queryString = queryString.substring(1);
    }
    for (const keyPair of queryString.split('&')) {
        const keyAndPair: string[] = keyPair.split('=');
        if (keyAndPair[0] === key && validateQueryParameters(key)) {
            return keyAndPair[1];
        }
    }
    return null;
}

