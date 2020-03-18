import { Projection } from '@basemaps/geo';
import {
    Const,
    HttpHeader,
    LambdaHttpResponse,
    LambdaHttpResponseCloudFront,
    LambdaHttpResponseCloudFrontRequest,
    ReqInfo,
    tileFromPath,
} from '@basemaps/lambda-shared';
import { queryStringExtractor } from './query';
import { ReqInfoCloudFront } from './req-info-cloudfront';
import { ValidateRequest } from './validate';

const projection = new Projection(256);

/**
 * Validate a CloudFront request has a valid API key and is not abusing the system
 */
export default async (info: ReqInfo): Promise<LambdaHttpResponse> => {
    // Expose some debugging metrics so we can plot tile requests onto a map
    const xyzData = tileFromPath(info.rest);
    if (xyzData == null) return new LambdaHttpResponseCloudFront(404, 'Not Found');
    const { x, y, z } = xyzData;
    const latLon = projection.getLatLonCenterFromTile(x, y, z);

    const { session, logger } = info;
    const { request } = info as ReqInfoCloudFront;

    session.set('xyz', { x, y, z });
    session.set('location', latLon);

    // Log the request uri and headers
    logger.info({ uri: request.uri, headers: request.headers }, 'HandleRequest');

    const apiKey = queryStringExtractor(request.querystring, Const.ApiKey.QueryString);
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
};
