import {
    HttpHeader,
    LambdaFunction,
    LambdaHttpResponseAlb,
    LambdaSession,
    LambdaType,
    LogType,
} from '@basemaps/shared';
import { ALBEvent, Context } from 'aws-lambda';
import { createHash } from 'crypto';
import { route } from './router';
import { TiffUtil } from './tiff';
import { Tilers } from './tiler';

// To force a full cache invalidation change this number
const RenderId = 1;

function getHeader(evt: ALBEvent, header: string): string | null {
    if (evt.headers) {
        return evt.headers[header.toLowerCase()];
    }
    return null;
}

export async function handleRequest(
    event: ALBEvent,
    context: Context,
    logger: LogType,
): Promise<LambdaHttpResponseAlb> {
    const session = LambdaSession.get();
    const tiler = Tilers.tile256;

    const httpMethod = event.httpMethod.toLowerCase();

    session.set('method', httpMethod);
    session.set('path', event.path);

    const pathMatch = route(httpMethod, event.path);
    if (LambdaHttpResponseAlb.isHttpResponse(pathMatch)) {
        return pathMatch;
    }

    const latLon = tiler.projection.getLatLonCenterFromTile(pathMatch.x, pathMatch.y, pathMatch.z);
    session.set('xyz', { x: pathMatch.x, y: pathMatch.y, z: pathMatch.z });
    session.set('location', latLon);

    const tiffs = await Promise.all(TiffUtil.load());
    const layers = await tiler.tile(tiffs, pathMatch.x, pathMatch.y, pathMatch.z, logger);

    if (layers == null) {
        // TODO serve empty PNG?
        return new LambdaHttpResponseAlb(404, 'Tile not found');
    }

    // Generate a unique hash given the full URI, the layers used and a renderId
    const cacheKey = createHash('sha256')
        .update(JSON.stringify({ pathMatch, layers, RenderId }))
        .digest('base64');

    // If the user has supplied a IfNoneMatch Header and it contains the full sha256 sum for our etag this tile has not been modified.
    const ifNoneMatch = getHeader(event, HttpHeader.IfNoneMatch);
    if (ifNoneMatch != null && ifNoneMatch.indexOf(cacheKey) > -1) {
        session.set('cache', { key: cacheKey, hit: true, match: ifNoneMatch });
        return new LambdaHttpResponseAlb(304, 'Not modified');
    }

    logger.info({ layers: layers.length }, 'Composing');
    session.timer.start('tile:compose');
    const buf = await tiler.raster.compose(
        layers,
        logger,
    );
    session.timer.end('tile:compose');

    if (buf == null) {
        // TODO serve empty PNG?
        return new LambdaHttpResponseAlb(404, 'Tile not found');
    }

    const response = new LambdaHttpResponseAlb(200, 'ok');
    response.buffer(buf, 'image/png');
    response.header(HttpHeader.ETag, cacheKey);
    return response;
}

export const handler = LambdaFunction.wrap<ALBEvent>(LambdaType.Alb, handleRequest);
