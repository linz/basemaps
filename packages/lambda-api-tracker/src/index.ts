import { LambdaContext, LambdaFunction, LambdaHttpResponse } from '@basemaps/lambda';
import { LogConfig, ProjectionTileMatrixSet, tileFromPath, TileType } from '@basemaps/shared';
import { ValidateRequest } from './validate';

function setTileInfo(ctx: LambdaContext): void {
    const xyzData = tileFromPath(ctx.action.rest);
    if (xyzData == null) return;

    if (xyzData.type === TileType.Image) {
        const { x, y, z, ext } = xyzData;
        ctx.set('xyz', { x, y, z });
        ctx.set('projection', xyzData.projection.code);
        ctx.set('extension', ext);

        const latLon = ProjectionTileMatrixSet.get(xyzData.projection.code).tileCenterToLatLon(xyzData);
        ctx.set('location', latLon);
    }
}

/**
 * Validate a CloudFront request has a valid API key and is not abusing the system
 */
export async function handleRequest(req: LambdaContext): Promise<LambdaHttpResponse> {
    req.set('name', 'LambdaApiTracker');

    if (LambdaContext.isCloudFrontEvent(req.evt)) {
        req.set('clientIp', req.evt.Records[0].cf.request.clientIp);
    }

    req.set('referer', req.header('referer'));
    req.set('userAgent', req.header('user-agent'));

    if (req.action.name === 'tiles') setTileInfo(req);

    // Validate the request throwing an error if anything goes wrong
    req.timer.start('validate');
    const res = await ValidateRequest.validate(req);
    req.timer.end('validate');

    if (res != null) return res;

    return new LambdaHttpResponse(100, 'Continue');
}

export const handler = LambdaFunction.wrap(handleRequest, LogConfig.get());
