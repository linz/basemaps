import { Projection } from '@basemaps/geo';
import {
    Const,
    HttpHeader,
    LambdaContext,
    LambdaFunction,
    LambdaHttpResponse,
    tileFromPath,
    TileType,
} from '@basemaps/lambda-shared';
import { ValidateRequest } from './validate';

const projection = new Projection(256);

function setTileInfo(ctx: LambdaContext): boolean {
    const xyzData = tileFromPath(ctx.action.rest);
    if (xyzData?.type === TileType.WMTS) {
        return true;
    }

    if (xyzData?.type === TileType.Image) {
        const { x, y, z } = xyzData;
        const latLon = projection.getLatLonCenterFromTile(x, y, z);
        ctx.set('xyz', { x, y, z });
        ctx.set('location', latLon);
    }
    return false;
}

/**
 * Validate a CloudFront request has a valid API key and is not abusing the system
 */
export async function handleRequest(req: LambdaContext): Promise<LambdaHttpResponse> {
    req.set('name', 'LambdaApiTracker');
    req.set('method', req.method);
    req.set('path', req.path);

    // Extract request information
    // ctx.set('clientIp', ctx.evt.clientIp); FIXME
    req.set('referer', req.header('referer'));
    req.set('userAgent', req.header('user-agent'));

    const doNotCache = req.action.name === 'tiles' && setTileInfo(req);

    const apiKey = req.query[Const.ApiKey.QueryString];
    if (apiKey == null || Array.isArray(apiKey)) {
        return new LambdaHttpResponse(400, 'Invalid API Key');
    }

    // Include the APIKey in the final log entry
    req.set(Const.ApiKey.QueryString, apiKey);

    // Validate the request throwing an error if anything goes wrong
    req.timer.start('validate');
    const res = await ValidateRequest.validate(apiKey, req);
    req.timer.end('validate');

    if (res != null) {
        return res;
    }

    const response = new LambdaHttpResponse(100, 'Continue');
    // Api key will be trimmed from the forwarded request so pass it via a well known header
    response.header(HttpHeader.ApiKey, apiKey);
    if (doNotCache) response.header(HttpHeader.CacheControl, 'max-age=0');
    return response;
}

export const handler = LambdaFunction.wrap(handleRequest);
