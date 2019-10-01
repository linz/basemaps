import { LambdaFunction, Logger, LambdaSession, HttpHeader } from '@basemaps/shared';
import { Tiler } from '@basemaps/tiler';
import { ALBEvent, ALBResult, Context } from 'aws-lambda';
import { getXyzFromPath } from './path';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import { CogTiff, Log } from '@cogeotiff/core';

function makeResponse(statusCode: number, message: string, headers?: { [key: string]: string }): ALBResult {
    if (headers == null) {
        headers = {};
    }
    const session = LambdaSession.get();
    headers[HttpHeader.ContentType] = 'application/json';
    headers[HttpHeader.RequestId] = session.id;
    if (session.correlationId) {
        headers[HttpHeader.CorrelationId] = session.correlationId;
    }
    return {
        statusCode,
        statusDescription: message,
        body: JSON.stringify({ status: statusCode, message }),
        headers,
        isBase64Encoded: false,
    };
}

const bucketName = process.env['COG_BUCKET'];
if (bucketName == null) {
    throw new Error('Invalid environment "COG_BUCKET"');
}

const tile256 = new Tiler(256);
const Tiffs: Promise<CogTiff>[] = [
    CogSourceAwsS3.create(
        bucketName,
        '2019-09-20-2019-NZ-Sentinel-3band-alpha.compress_webp.align_google.aligned_3.bs_512.tif',
    ),
    CogSourceAwsS3.create(bucketName, '2019-09-30-bg43.webp.google.aligned.cog.tif'),
];

export async function handleRequest(event: ALBEvent, context: Context, logger: typeof Logger): Promise<ALBResult> {
    const session = LambdaSession.get();

    Log.set(logger);
    const httpMethod = event.httpMethod.toLowerCase();

    session.set('method', httpMethod);
    session.set('path', event.path);

    // Allow cross origin requests
    if (httpMethod === 'options') {
        return makeResponse(200, 'Options', {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'false',
            'Access-Control-Allow-Methods': 'OPTIONS,GET,PUT,POST,DELETE',
        });
    }

    if (httpMethod !== 'get') {
        return makeResponse(405, 'Method not allowed');
    }

    const pathMatch = getXyzFromPath(event.path);
    if (pathMatch == null) {
        return makeResponse(404, 'Path not found');
    }

    const latLon = tile256.projection.getLatLonCenterFromTile(pathMatch.x, pathMatch.y, pathMatch.z);
    session.set('xyz', { x: pathMatch.x, y: pathMatch.y, z: pathMatch.z });
    session.set('location', latLon);

    const tiffs = await Promise.all(Tiffs);
    const buffer = await tile256.tile(tiffs, pathMatch.x, pathMatch.y, pathMatch.z, logger);

    if (buffer == null) {
        // TODO serve empty PNG?
        return makeResponse(404, 'Tile not found');
    }

    return {
        statusCode: 200,
        statusDescription: 'ok',
        headers: {
            [HttpHeader.ContentType]: 'image/png',
            [HttpHeader.RequestId]: session.id,
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true,
    };
}

export const handler = LambdaFunction.wrap<ALBEvent, ALBResult>(handleRequest);
