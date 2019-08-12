import { DB_NAME } from '@basemaps/const';

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

export async function queryStringExtractor(queryString: string) {
    console.log(queryString + 'bar');
}
