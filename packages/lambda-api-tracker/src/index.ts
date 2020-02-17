import { Projection } from '@basemaps/geo';
import {
    Const,
    getXyzFromPath,
    HttpHeader,
    LambdaFunction,
    LambdaHttpResponse,
    LambdaHttpResponseCloudFront,
    LambdaHttpResponseCloudFrontRequest,
    LambdaSession,
    LambdaType,
    LogType,
} from '@basemaps/lambda-shared';
import { CloudFrontHeaders, CloudFrontRequestEvent } from 'aws-lambda';
import { queryStringExtractor } from './query';
import { ValidateRequest } from './validate';

const projection = new Projection(256);

/**
 * Load a header value from CloudFront headers
 *
 * @param headers CloudFrontHeaders
 * @param key header key to load (lower case)
 */
function getHeader(headers: CloudFrontHeaders, key: string): string | null {
    const headerVal = headers[key];
    if (headerVal == null) {
        return null;
    }
    if (headerVal.length < 1) {
        return null;
    }
    return headerVal[0].value;
}
/**
 * Validate a CloudFront request has a valid API key and is not abusing the system
 */
export async function handleRequest(
    event: CloudFrontRequestEvent,
    session: LambdaSession,
    logger: LogType,
): Promise<LambdaHttpResponse> {
    const [record] = event.Records;
    const request = record.cf.request;
    const queryString = request.querystring;

    session.set('name', 'LambdaApiTracker');
    session.set('method', request.method.toLowerCase());
    session.set('path', request.uri);

    // Extract request information
    session.set('clientIp', request.clientIp);
    session.set('referer', getHeader(request.headers, 'referer'));
    session.set('userAgent', getHeader(request.headers, 'user-agent'));

    // Expose some debugging metrics so we can plot tile requests onto a map
    const pathMatch = getXyzFromPath(request.uri);
    if (pathMatch != null) {
        const latLon = projection.getLatLonCenterFromTile(pathMatch.x, pathMatch.y, pathMatch.z);
        session.set('xyz', { x: pathMatch.x, y: pathMatch.y, z: pathMatch.z });
        session.set('location', latLon);
    }

    // Log the entire request
    // TODO this may be too much data, we should possibly limit how much we log out (ip/useragent etc..)
    logger.info({ request }, 'HandleRequest');

    const apiKey = queryStringExtractor(queryString, Const.ApiKey.QueryString);
    if (apiKey == null) {
        return new LambdaHttpResponseCloudFront(400, 'Invalid API Key');
    }

    // Include the APIKey in the final log entry
    session.set(Const.ApiKey.QueryString, apiKey);

    // Validate the request throwing an error if anything goes wrong
    session.timer.start('validate');
    const res = await ValidateRequest.validate(apiKey, session, logger);
    session.timer.end('validate');

    if (res != null) {
        return res;
    }

    const response = new LambdaHttpResponseCloudFrontRequest(request);
    response.header(HttpHeader.CorrelationId, session.correlationId);
    // Api key will be trimmed from the forwarded request so pass it via a well known header
    response.header(HttpHeader.ApiKey, apiKey);
    return response;
}

export const handler = LambdaFunction.wrap<CloudFrontRequestEvent>(LambdaType.CloudFront, handleRequest);
