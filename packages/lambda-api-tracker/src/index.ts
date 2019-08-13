import {
    CloudFrontRequestEvent,
    CloudFrontRequestHandler,
    Context,
    Callback,
    CloudFrontRequestResult,
} from 'aws-lambda';

export async function handler(
    event: CloudFrontRequestEvent,
    context: Context,
    callback: Callback<CloudFrontRequestResult>,
) {
    var x = event.Records[0].cf.request.querystring;
    console.log(x);
}


/** Extracts a named value from a query string but defaults to the key 'api' if none provided */
export function queryStringExtractor (queryString: string, keyString: string = 'api') {
    if (queryString.startsWith('?')) { queryString = queryString.substring(1); }
    //console.log('QS '+ queryString);
    for (const keyPair of queryString.split('&')) {
        //console.log('KP ' + keyPair);
        const keyAndPair : string[] = keyPair.split('=');
        if (keyAndPair[0] === keyString) {
            return keyAndPair[1];
        }   
    }
    return null;
}