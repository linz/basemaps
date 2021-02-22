import { LambdaContext, LambdaFunction, LambdaHttpResponse, ValidateTilePath } from '@basemaps/lambda';
import { LogConfig, tileFromPath, TileType, getUrlHost } from '@basemaps/shared';
import { ValidateRequest } from './validate';

/**
 * Validate a CloudFront request has a valid API key and is not abusing the system
 */
export async function handleRequest(req: LambdaContext): Promise<LambdaHttpResponse> {
    req.set('name', 'LambdaApiTracker');

    if (LambdaContext.isCloudFrontEvent(req.evt)) {
        req.set('clientIp', req.evt.Records[0].cf.request.clientIp);
    }

    /**
     * We generally don't need the full referer to get
     * a understanding of where the request came from
     */
    req.set('referer', getUrlHost(req.header('referer')));
    req.set('userAgent', req.header('user-agent'));

    if (req.action.name === 'tiles') {
        const xyzData = tileFromPath(req.action.rest);
        if (xyzData?.type === TileType.Image) ValidateTilePath.validate(req, xyzData);
    }

    // Validate the request throwing an error if anything goes wrong
    req.timer.start('validate');
    const res = await ValidateRequest.validate(req);
    req.timer.end('validate');

    if (res != null) return res;

    return new LambdaHttpResponse(100, 'Continue');
}

export const handler = LambdaFunction.wrap(handleRequest, LogConfig.get());
