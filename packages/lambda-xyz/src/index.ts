import { HttpHeader, LambdaFunction, LambdaHttpResponseAlb, LambdaSession, LambdaType, Logger } from '@basemaps/shared';
import { Tiler } from '@basemaps/tiler';
import { CogTiff, Log } from '@cogeotiff/core';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import { ALBEvent, Context } from 'aws-lambda';
import { createHash } from 'crypto';
import { route } from './router';

const bucketName = process.env['COG_BUCKET'];
if (bucketName == null) {
    throw new Error('Invalid environment "COG_BUCKET"');
}

// To force a full cache invalidation change this number
const RenderId = 1;

const tile256 = new Tiler(256);
const Tiffs: Promise<CogTiff>[] = [
    CogSourceAwsS3.create(
        bucketName,
        '2019-09-20-2019-NZ-Sentinel-3band-alpha.compress_webp.align_google.aligned_3.bs_512.tif',
    ),
    CogSourceAwsS3.create(bucketName, '2019-09-30-bg43.webp.google.aligned.cog.tif'),
];

function getHeader(evt: ALBEvent, header: string): string | null {
    if (evt.headers) {
        return evt.headers[header.toLowerCase()];
    }
    return null;
}

export async function handleRequest(
    event: ALBEvent,
    context: Context,
    logger: typeof Logger,
): Promise<LambdaHttpResponseAlb> {
    const session = LambdaSession.get();

    Log.set(logger);
    const httpMethod = event.httpMethod.toLowerCase();

    session.set('method', httpMethod);
    session.set('path', event.path);

    const pathMatch = route(httpMethod, event.path);
    if (LambdaHttpResponseAlb.isHttpResponse(pathMatch)) {
        return pathMatch;
    }

    const latLon = tile256.projection.getLatLonCenterFromTile(pathMatch.x, pathMatch.y, pathMatch.z);
    session.set('xyz', { x: pathMatch.x, y: pathMatch.y, z: pathMatch.z });
    session.set('location', latLon);

    const tiffs = await Promise.all(Tiffs);
    const layers = await tile256.tile(tiffs, pathMatch.x, pathMatch.y, pathMatch.z, logger);
    if (layers == null) {
        // TODO serve empty PNG?
        throw new LambdaHttpResponseAlb(404, 'Tile not found');
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
    const buf = await tile256.raster.compose(
        layers,
        logger,
    );
    session.timer.end('tile:compose');

    if (buf == null) {
        // TODO serve empty PNG?
        throw new LambdaHttpResponseAlb(404, 'Tile not found');
    }

    const response = new LambdaHttpResponseAlb(200, 'ok');
    response.buffer(buf, 'image/png');
    response.header(HttpHeader.ETag, cacheKey);
    return response;
}

export const handler = LambdaFunction.wrap<ALBEvent>(LambdaType.Alb, handleRequest);
