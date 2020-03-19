import { Projection } from '@basemaps/geo';
import {
    Const,
    HttpHeader,
    LambdaHttpResponse,
    LambdaHttpResponseCloudFront,
    LambdaHttpResponseCloudFrontRequest,
    LambdaSession,
    LogType,
    tileFromPath,
    populateAction,
    TileType,
    LambdaType,
    LambdaFunction,
} from '@basemaps/lambda-shared';
import { CloudFrontRequestEvent } from 'aws-lambda';
import { queryStringExtractor } from './query';
import { ReqInfoCloudFront } from './req-info-cloudfront';
import { ValidateRequest } from './validate';

const projection = new Projection(256);

const setTileSession = (info: ReqInfoCloudFront): void => {
    const xyzData = tileFromPath(info.rest);
    if (xyzData?.type === TileType.Image) {
        const { x, y, z } = xyzData;
        const latLon = projection.getLatLonCenterFromTile(x, y, z);
        const { session } = info;
        session.set('xyz', { x, y, z });
        session.set('location', latLon);
    }
};

/**
 * Validate a CloudFront request has a valid API key and is not abusing the system
 */
export async function handleRequest(
    event: CloudFrontRequestEvent,
    session: LambdaSession,
    logger: LogType,
): Promise<LambdaHttpResponse> {
    const info = new ReqInfoCloudFront(event, session, logger);
    populateAction(info);

    session.set('name', 'LambdaApiTracker');
    session.set('method', info.httpMethod);
    session.set('path', info.urlPath);

    // Extract request information
    session.set('clientIp', info.request.clientIp);
    session.set('referer', info.getHeader('referer'));
    session.set('userAgent', info.getHeader('user-agent'));

    if (info.action === 'tiles') setTileSession(info);

    const { request } = info as ReqInfoCloudFront;

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
}

export const handler = LambdaFunction.wrap<CloudFrontRequestEvent>(LambdaType.CloudFront, handleRequest);
