import { Epsg, QuadKey } from '@basemaps/geo';
import {
    Aws,
    Env,
    HttpHeader,
    LambdaContext,
    LambdaHttpResponse,
    LogType,
    TileDataWmts,
    TileDataXyz,
    tileFromPath,
    TileMetadataTag,
    TileType,
} from '@basemaps/lambda-shared';
import { TileMakerSharp } from '@basemaps/tiler-sharp';
import { CogTiff } from '@cogeotiff/core';
import { createHash } from 'crypto';
import pLimit from 'p-limit';
import { EmptyPng } from '../png';
import { TileSet } from '../tile.set';
import { loadTileSet } from '../tile.set.cache';
import { Tilers } from '../tiler';
import { WmtsCapabilities } from '../wmts.capability';
import { TileEtag } from './tile.etag';

export const TileComposer = new TileMakerSharp(256);
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

/** Background color of tiles where the tileset does not define a color */
const DefaultBackground = { r: 0, g: 0, b: 0, alpha: 0 };

/** Initialize the tiffs before reading */
async function initTiffs(tileSet: TileSet, qk: string, zoom: number, logger: LogType): Promise<CogTiff[]> {
    const tiffs = await tileSet.getTiffsForQuadKey(qk, zoom);
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
    const tiler = Tilers.get(xyzData.projection);
    if (tiler == null) return new LambdaHttpResponse(404, `Projection: ${xyzData.projection} Not Found`);

    const { x, y, z, ext } = xyzData;

    // FIXME
    // const latLon = tiler.projection.getLatLonCenterFromTile(x, y, z);
    const qk = QuadKey.fromTile(xyzData);
    req.set('xyz', { x, y, z });
    // req.set('location', latLon);
    req.set('quadKey', qk);

    const tileSet = await loadTileSet(req, xyzData.name, xyzData.projection);
    if (tileSet == null) return new LambdaHttpResponse(404, 'Tileset Not Found');

    const tiffs = await initTiffs(tileSet, qk, z, req.log);
    const layers = await tiler.tile(tiffs, x, y, z);

    // Generate a unique hash given the full URI, the layers used and a renderId
    const cacheKey = TileEtag.generate(layers, xyzData);

    req.set('layers', layers.length);

    const respNotMod = checkNotModified(req, cacheKey);
    if (respNotMod != null) return respNotMod;

    if (!Env.isProduction()) {
        for (const layer of layers) {
            const layerId = layer.tiff.source.name;
            req.log.debug({ layerId, layerSource: layer.source }, 'Compose');
        }
    }

    req.timer.start('tile:compose');
    const res = await TileComposer.compose({
        layers,
        format: ext,
        background: tileSet.background ?? DefaultBackground,
    });
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

    // TODO when we support more than one projection
    const tileSet = await loadTileSet(req, wmtsData.name, wmtsData.projection ?? Epsg.Google);
    const provider = await Aws.tileMetadata.Provider.get(TileMetadataTag.Production);
    if (tileSet == null || provider == null) return new LambdaHttpResponse(404, 'Not Found');

    const xml = WmtsCapabilities.toXml(host, provider, [tileSet], req.apiKey);
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
        return Tile(req, xyzData);
    }
}
