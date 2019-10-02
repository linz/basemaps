import {
    Const,
    HttpHeader,
    LambdaFunction,
    LambdaHttpResponse,
    LambdaHttpResponseCloudFront,
    LambdaHttpResponseCloudFrontRequest,
    LambdaSession,
    LambdaType,
    Logger,
} from '@basemaps/shared';
import { CloudFrontRequestEvent, Context } from 'aws-lambda';
import { queryStringExtractor } from './query';
import { ValidateRequest } from './validate';

/**
 * Validate a CloudFront request has a valid API key and is not abusing the system
 */
export async function handleRequest(
    event: CloudFrontRequestEvent,
    context: Context,
    logger: typeof Logger,
): Promise<LambdaHttpResponse> {
    const session = LambdaSession.get();
    const [record] = event.Records;
    const request = record.cf.request;
    const queryString = request.querystring;

    // Log the entire request
    // TODO this may be too much data, we should possibly limit how much we log out (ip/useragent etc..)
    logger.info({ request }, 'HandleRequest');

    const apiKey = queryStringExtractor(queryString, Const.ApiKey.QueryString);
    if (apiKey == null) {
        return new LambdaHttpResponseCloudFront(400, 'Invalid API Key');
    }

    // Validate the request throwing an error if anything goes wrong
    session.timer.start('validate');
    const res = await ValidateRequest.validate(apiKey, logger);
    session.timer.end('validate');

    if (res != null) {
        return res;
    }

    const response = new LambdaHttpResponseCloudFrontRequest(request);
    response.header(HttpHeader.CorrelationId, session.correlationId);
    response.header(HttpHeader.ApiKey, apiKey); // Api key will be trimmed from the forwarded request
    return response;
}

export const handler = LambdaFunction.wrap<CloudFrontRequestEvent>(LambdaType.CloudFront, handleRequest);
