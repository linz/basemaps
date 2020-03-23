import {
    Env,
    HttpHeader,
    LambdaHttpResponseAlb,
    LambdaSession,
    LogType,
    ReqInfo,
    tileFromPath,
    TileType,
    TileDataXyz,
    TileDataWmts,
} from '@basemaps/lambda-shared';
import { CogTiff } from '@cogeotiff/core';
import { createHash } from 'crypto';
import pLimit from 'p-limit';
import { EmptyPng } from './png';
import { TiffUtil } from './tiff';
import { Tilers } from './tiler';
import { ImageFormat } from '@basemaps/tiler';
import { buildWmtsCapability } from './wmts-capability';

// To force a full cache invalidation change this number
const RenderId = 1;

const notFound = (): LambdaHttpResponseAlb => new LambdaHttpResponseAlb(404, 'Not Found');

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

const image = async (info: ReqInfo, xyzData: TileDataXyz): Promise<LambdaHttpResponseAlb> => {
    const { session, logger } = info;
    const tiler = Tilers.tile256;
    const tileMaker = Tilers.compose256;

    const { x, y, z } = xyzData;

    const latLon = tiler.projection.getLatLonCenterFromTile(x, y, z);
    const qk = tiler.projection.getQuadKeyFromTile(x, y, z);
    session.set('xyz', { x, y, z });
    session.set('location', latLon);
    session.set('quadKey', qk);

    const tiffs = await initTiffs(qk, z, logger);
    const layers = await tiler.tile(tiffs, x, y, z);

    // Generate a unique hash given the full URI, the layers used and a renderId
    const cacheKey = createHash('sha256')
        .update(JSON.stringify({ xyzData, layers, RenderId }))
        .digest('base64');

    if (layers == null) {
        return emptyPng(session, cacheKey);
    }

    session.set('layers', layers.length);

    // If the user has supplied a IfNoneMatch Header and it contains the full sha256 sum for our etag this tile has not been modified.
    const ifNoneMatch = info.getHeader(HttpHeader.IfNoneMatch);
    if (ifNoneMatch != null && ifNoneMatch.indexOf(cacheKey) > -1) {
        session.set('cache', { key: cacheKey, hit: true, match: ifNoneMatch });
        return new LambdaHttpResponseAlb(304, 'Not modified');
    }

    if (!Env.isProduction()) {
        for (const layer of layers) {
            logger.debug({ layerId: layer.id, layerSource: layer.source }, 'Compose');
        }
    }

    session.timer.start('tile:compose');
    const res = await tileMaker.compose({ layers, format: ImageFormat.PNG });
    session.timer.end('tile:compose');
    session.set('layersUsed', res.layers);
    session.set('allLayersUsed', res.layers == layers.length);

    if (res == null) {
        return emptyPng(session, cacheKey);
    }
    session.set('bytes', res.buffer.byteLength);
    const response = new LambdaHttpResponseAlb(200, 'ok');
    response.header(HttpHeader.ETag, cacheKey);
    response.buffer(res.buffer, 'image/png');
    return response;
};

const wmts = (info: ReqInfo, wmtsData: TileDataWmts): LambdaHttpResponseAlb => {
    const response = new LambdaHttpResponseAlb(200, 'ok');

    const host = ''; // TODO get the full protocol + host.

    const xml = buildWmtsCapability(host, wmtsData.tileSet, wmtsData.projection);

    if (xml == null) return notFound();

    const data = Buffer.from(xml);

    const cacheKey = createHash('sha256')
        .update(data)
        .digest('base64');

    response.header(HttpHeader.ETag, cacheKey);
    response.buffer(data, 'text/xml');
    return response;
};

export default async (info: ReqInfo): Promise<LambdaHttpResponseAlb> => {
    const xyzData = tileFromPath(info.rest);
    if (xyzData == null) return notFound();
    if (xyzData.type === TileType.WMTS) {
        return wmts(info, xyzData);
    } else {
        return await image(info, xyzData);
    }
};
