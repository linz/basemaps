import { Const, LambdaFunction, Logger } from '@basemaps/shared';
import { CloudFrontRequestEvent, CloudFrontRequestResult, CloudFrontResultResponse, Context } from 'aws-lambda';
import { ValidateRequest, ValidateRequestResponse } from './validate';
import { queryStringExtractor } from './query';

/**
 * Make a CloudFront response from validation message
 */
function makeResponse(response: ValidateRequestResponse): CloudFrontResultResponse {
    const cfResponse: CloudFrontResultResponse = {
        status: String(response.status),
        statusDescription: response.reason,
        body: JSON.stringify({ status: response.status, message: response.reason }),
        bodyEncoding: 'text',
    };
    if (response.headers) {
        cfResponse.headers = {};
        for (const [key, value] of Object.entries(response.headers)) {
            cfResponse.headers[key.toLowerCase()] = [{ key, value: String(value) }];
        }
    }
    return cfResponse;
}

/**
 * Validate a CloudFront request has a valid API key and is not abusing the system
 */
export async function handleRequest(
    event: CloudFrontRequestEvent,
    context: Context,
    logger: typeof Logger,
): Promise<CloudFrontRequestResult> {
    const [record] = event.Records;
    const request = record.cf.request;
    const queryString = request.querystring;
    // Log the entire request
    // TODO this may be too much data, we should possibly limit how much we log out (ip/useragent etc..)
    logger.info({ request }, 'HandleRequest');

    const apiKey = queryStringExtractor(queryString, Const.ApiKey.QueryString);
    const result = await ValidateRequest.validate(apiKey, logger);
    // API Key validated allow request
    if (result.status === 200) {
        return request;
    }
    // Failed to validate send a error back
    return makeResponse(result);
}

export const handler = LambdaFunction.wrap<CloudFrontRequestEvent, CloudFrontRequestResult>(handleRequest);
