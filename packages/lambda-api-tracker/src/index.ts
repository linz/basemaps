import { LambdaContext, LambdaFunction, LambdaHttpResponse, ValidateTilePath } from '@basemaps/lambda';
import { LogConfig, tileFromPath, TileType } from '@basemaps/shared';
import { ValidateRequest } from './validate';

/** Extract the hostname from a url */
export function getUrlHost(ref: string | undefined): string | undefined {
    if (ref == null) return ref;
    try {
        const { hostname } = new URL(ref);
        if (hostname == null) return ref;
        if (hostname.startsWith('www.')) return hostname.slice(4);
        return hostname;
    } catch (e) {
        // Ignore
    }
    return ref;
}

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

    const xyzData = tileFromPath(req.action.rest);
    if (xyzData?.type == TileType.Image) ValidateTilePath.validate(req, xyzData);

    // Validate the request throwing an error if anything goes wrong
    req.timer.start('validate');
    const res = await ValidateRequest.validate(req);
    req.timer.end('validate');

    if (res != null) return res;

    return new LambdaHttpResponse(100, 'Continue');
}

export const handler = LambdaFunction.wrap(handleRequest, LogConfig.get());
