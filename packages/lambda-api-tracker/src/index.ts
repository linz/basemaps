import {
    Const,
    Projection,
    getXyzFromPath,
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

const projection = new Projection(256);
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

    session.set('method', request.method.toLowerCase());
    session.set('path', request.uri);

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
    const res = await ValidateRequest.validate(apiKey, logger);
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
