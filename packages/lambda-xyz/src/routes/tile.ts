import {
    Env,
    HttpHeader,
    LambdaContext,
    LambdaHttpResponse,
    LogType,
    tileFromPath,
    TileType,
    TileDataWmts,
    TileDataXyz,
} from '@basemaps/lambda-shared';
import { CogTiff } from '@cogeotiff/core';
import { createHash } from 'crypto';
import pLimit from 'p-limit';
import { EmptyPng } from '../png';
import { TiffUtil } from '../tiff';
import { Tilers } from '../tiler';
import { buildWmtsCapability } from '../wmts.capability';

// To force a full cache invalidation change this number
const RenderId = 1;

/**
 * Serve a empty PNG response
 * @param req req to store metrics in
 * @param cacheKey ETag of the request
 */
function emptyPng(req: LambdaContext, cacheKey: string): LambdaHttpResponse {
    req.set('bytes', EmptyPng.byteLength);
    req.set('emptyPng', true);
    const response = new LambdaHttpResponse(200, 'ok');
    response.headers.set(HttpHeader.ETag, cacheKey);
    response.buffer(EmptyPng, 'image/png');
    return response;
}
const LoadingQueue = pLimit(Env.getNumber(Env.TiffConcurrency, 5));

/** Initialize the tiffs before reading */
async function initTiffs(qk: string, zoom: number, logger: LogType): Promise<CogTiff[]> {
    const tiffs = TiffUtil.getTiffsForQuadKey(qk, zoom);
    let failed = false;
    // Remove any tiffs that failed to load
    const promises = tiffs.map((c) => {
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
        return tiffs.filter((f) => f.images.length > 0);
    }
    return tiffs;
}

function checkNotModified(req: LambdaContext, cacheKey: string): LambdaHttpResponse | null {
    // If the user has supplied a IfNoneMatch Header and it contains the full sha256 sum for our
    // etag this tile has not been modified.
    const ifNoneMatch = req.header(HttpHeader.IfNoneMatch);
    if (ifNoneMatch != null && ifNoneMatch.indexOf(cacheKey) > -1) {
        req.set('cache', { key: cacheKey, hit: true, match: ifNoneMatch });
        return new LambdaHttpResponse(304, 'Not modified');
    }
    return null;
}

export async function Tile(req: LambdaContext, xyzData: TileDataXyz): Promise<LambdaHttpResponse> {
    const tiler = Tilers.tile256;
    const tileMaker = Tilers.compose256;

    const { x, y, z, ext } = xyzData;

    const latLon = tiler.projection.getLatLonCenterFromTile(x, y, z);
    const qk = tiler.projection.getQuadKeyFromTile(x, y, z);
    req.set('xyz', { x, y, z });
    req.set('location', latLon);
    req.set('quadKey', qk);

    const tiffs = await initTiffs(qk, z, req.log);
    const layers = await tiler.tile(tiffs, x, y, z);

    // Generate a unique hash given the full URI, the layers used and a renderId
    const cacheKey = createHash('sha256').update(JSON.stringify({ xyzData, layers, RenderId })).digest('base64');

    if (layers == null) {
        return emptyPng(req, cacheKey);
    }

    req.set('layers', layers.length);

    const respNotMod = checkNotModified(req, cacheKey);
    if (respNotMod != null) return respNotMod;

    if (!Env.isProduction()) {
        for (const layer of layers) {
            req.log.debug({ layerId: layer.id, layerSource: layer.source }, 'Compose');
        }
    }

    req.timer.start('tile:compose');
    const res = await tileMaker.compose({ layers, format: ext });
    req.timer.end('tile:compose');
    req.set('layersUsed', res.layers);
    req.set('allLayersUsed', res.layers == layers.length);

    if (res == null) {
        return emptyPng(req, cacheKey);
    }
    req.set('bytes', res.buffer.byteLength);
    const response = new LambdaHttpResponse(200, 'ok');
    response.header(HttpHeader.ETag, cacheKey);
    response.buffer(res.buffer, 'image/' + ext);
    return response;
}

export async function Wmts(req: LambdaContext, wmtsData: TileDataWmts): Promise<LambdaHttpResponse> {
    const response = new LambdaHttpResponse(200, 'ok');

    const host = Env.get(Env.PublicUrlBase);

    const xml = buildWmtsCapability(host, req.apiKey || '', wmtsData.tileSet, wmtsData.projection);

    if (xml == null) return new LambdaHttpResponse(404, 'Not Found');

    const data = Buffer.from(xml);

    const cacheKey = createHash('sha256').update(data).digest('base64');

    const respNotMod = checkNotModified(req, cacheKey);
    if (respNotMod != null) return respNotMod;

    response.header(HttpHeader.ETag, cacheKey);
    response.header(HttpHeader.CacheControl, 'max-age=0');
    response.buffer(data, 'text/xml');
    return response;
}

export async function TileOrWmts(req: LambdaContext): Promise<LambdaHttpResponse> {
    const xyzData = tileFromPath(req.action.rest);
    if (xyzData == null) return new LambdaHttpResponse(404, 'Not Found');
    if (xyzData.type === TileType.WMTS) {
        return Wmts(req, xyzData);
    } else {
        return await Tile(req, xyzData);
    }
}
