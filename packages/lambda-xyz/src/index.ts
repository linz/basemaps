import {
    Env,
    HttpHeader,
    LambdaFunction,
    LambdaHttpResponseAlb,
    LambdaSession,
    LambdaType,
    LogType,
} from '@basemaps/lambda-shared';
import { ALBEvent, Context } from 'aws-lambda';
import { createHash } from 'crypto';
import pLimit from 'p-limit';
import { EmptyPng } from './png';
import { route } from './router';
import { TiffUtil } from './tiff';
import { Tilers } from './tiler';
import { CogTiff } from '@cogeotiff/core';

// To force a full cache invalidation change this number
const RenderId = 1;

function getHeader(evt: ALBEvent, header: string): string | null {
    if (evt.headers) {
        return evt.headers[header.toLowerCase()];
    }
    return null;
}

/**
 * Serve a empty PNG response
 * @param session session to store metrics in
 * @param cacheKey ETag of the request
 */
function emptyPng(session: LambdaSession, cacheKey: string): LambdaHttpResponseAlb {
    session.set('bytes', EmptyPng.byteLength);
    session.set('emptyPng', true);
    const response = new LambdaHttpResponseAlb(200, 'ok');
    response.header(HttpHeader.ETag, cacheKey);
    response.buffer(EmptyPng, 'image/png');
    return response;
}
const LoadingQueue = pLimit(Env.getNumber(Env.TiffConcurrency, 5));

/** Initialize the tiffs before reading */
async function initTiffs(qk: string, zoom: number, logger: LogType): Promise<CogTiff[]> {
    const tiffs = TiffUtil.getTiffsForQuadKey(qk, zoom);
    let failed = false;
    // Remove any tiffs that failed to load
    const promises = tiffs.map(c => {
        return LoadingQueue(async () => {
            try {
                await c.init();
            } catch (error) {
                logger.warn({ error, tiff: c.source.name }, 'TiffLoadFailed');
                failed = true;
            }
        });
    });
    await Promise.all(promises);
    if (failed) {
        return tiffs.filter(f => f.images.length > 0);
    }
    return tiffs;
}

export async function handleRequest(
    event: ALBEvent,
    context: Context,
    logger: LogType,
): Promise<LambdaHttpResponseAlb> {
    const session = LambdaSession.get();
    const tiler = Tilers.tile256;
    const tileMaker = Tilers.compose256;

    const httpMethod = event.httpMethod.toLowerCase();

    session.set('name', 'LambdaXyzTiler');
    session.set('method', httpMethod);
    session.set('path', event.path);

    const pathMatch = route(httpMethod, event.path);
    if (LambdaHttpResponseAlb.isHttpResponse(pathMatch)) {
        return pathMatch;
    }

    const latLon = tiler.projection.getLatLonCenterFromTile(pathMatch.x, pathMatch.y, pathMatch.z);
    const qk = tiler.projection.getQuadKeyFromTile(pathMatch.x, pathMatch.y, pathMatch.z);
    session.set('xyz', { x: pathMatch.x, y: pathMatch.y, z: pathMatch.z });
    session.set('location', latLon);
    session.set('quadKey', qk);

    const tiffs = await initTiffs(qk, pathMatch.z, logger);
    const layers = await tiler.tile(tiffs, pathMatch.x, pathMatch.y, pathMatch.z);

    // Generate a unique hash given the full URI, the layers used and a renderId
    const cacheKey = createHash('sha256')
        .update(JSON.stringify({ pathMatch, layers, RenderId }))
        .digest('base64');

    if (layers == null) {
        return emptyPng(session, cacheKey);
    }
    session.set('layers', layers.length);

    // If the user has supplied a IfNoneMatch Header and it contains the full sha256 sum for our etag this tile has not been modified.
    const ifNoneMatch = getHeader(event, HttpHeader.IfNoneMatch);
    if (ifNoneMatch != null && ifNoneMatch.indexOf(cacheKey) > -1) {
        session.set('cache', { key: cacheKey, hit: true, match: ifNoneMatch });
        return new LambdaHttpResponseAlb(304, 'Not modified');
    }

    logger.info({ layers: layers.length }, 'Composing');
    session.timer.start('tile:compose');
    const res = await tileMaker.compose(layers);
    session.timer.end('tile:compose');

    if (res == null) {
        return emptyPng(session, cacheKey);
    }
    session.set('bytes', res.buffer.byteLength);
    const response = new LambdaHttpResponseAlb(200, 'ok');
    response.header(HttpHeader.ETag, cacheKey);
    response.buffer(res.buffer, 'image/png');
    return response;
}

export const handler = LambdaFunction.wrap<ALBEvent>(LambdaType.Alb, handleRequest);
