import { Epsg, Tile, TileMatrixSet } from '@basemaps/geo';
import { HttpHeader, LambdaContext, LambdaHttpResponse, ValidateTilePath } from '@basemaps/lambda';
import {
    Aws,
    DefaultBackground,
    Env,
    setNameAndProjection,
    TileMetadataNamedTag,
    tileWmtsFromPath,
    tileXyzFromPath,
} from '@basemaps/shared';
import { Tiler } from '@basemaps/tiler';
import { TileMakerSharp } from '@basemaps/tiler-sharp';
import { CogTiff } from '@cogeotiff/core';
import { createHash } from 'crypto';
import pLimit from 'p-limit';
import { TileSet } from '../tile.set';
import { loadTileSet, loadTileSets } from '../tile.set.cache';
import { Tilers } from '../tiler';
import { WmtsCapabilities } from '../wmts.capability';
import { attribution } from './attribution';
import { TileEtag } from './tile.etag';

export const TileComposer = new TileMakerSharp(256);
const LoadingQueue = pLimit(Env.getNumber(Env.TiffConcurrency, 5));

const DefaultResizeKernel = { in: 'lanczos3', out: 'lanczos3' } as const;

const NotFound = new LambdaHttpResponse(404, 'Not Found');

/** Initialize the tiffs before reading */
async function initTiffs(tileSet: TileSet, tiler: Tiler, tile: Tile, ctx: LambdaContext): Promise<CogTiff[]> {
    const tiffs = tileSet.getTiffsForTile(tiler.tms, tile);
    let failed = false;
    // Remove any tiffs that failed to load
    const promises = tiffs.map((c) => {
        return LoadingQueue(async () => {
            try {
                await c.init();
            } catch (error) {
                ctx.log.warn({ error, tiff: c.source.name }, 'TiffLoadFailed');
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

function projectionNotFound(projection: Epsg, altTms?: string): LambdaHttpResponse {
    let code = projection.toEpsgString();
    if (altTms != null) {
        code += ':' + altTms;
    }
    return new LambdaHttpResponse(404, `Projection not found: ${code}`);
}

export async function tile(req: LambdaContext): Promise<LambdaHttpResponse> {
    const xyzData = tileXyzFromPath(req.action.rest);
    if (xyzData == null) return NotFound;
    ValidateTilePath.validate(req, xyzData);
    const tiler = Tilers.get(xyzData.projection, xyzData.altTms);
    if (tiler == null) return projectionNotFound(xyzData.projection);

    const { x, y, z, ext } = xyzData;

    req.timer.start('tileset:load');
    const tileSet = await loadTileSet(xyzData.name, xyzData.projection);
    req.timer.end('tileset:load');
    if (tileSet == null) return new LambdaHttpResponse(404, 'Tileset Not Found');

    const tiffs = await initTiffs(tileSet, tiler, xyzData, req);
    const layers = await tiler.tile(tiffs, x, y, z);

    // Generate a unique hash given the full URI, the layers used and a renderId
    const cacheKey = TileEtag.generate(layers, xyzData);

    req.set('layers', layers.length);

    const respNotMod = checkNotModified(req, cacheKey);
    if (respNotMod != null) return respNotMod;

    req.timer.start('tile:compose');
    const res = await TileComposer.compose({
        layers,
        format: ext,
        background: tileSet.background ?? DefaultBackground,
        resizeKernel: tileSet.resizeKernel ?? DefaultResizeKernel,
    });
    req.timer.end('tile:compose');
    req.set('layersUsed', res.layers);
    req.set('allLayersUsed', res.layers == layers.length);
    req.set('bytes', res.buffer.byteLength);

    const response = new LambdaHttpResponse(200, 'ok');
    response.header(HttpHeader.ETag, cacheKey);
    response.header(HttpHeader.CacheControl, 'public, max-age=604800');
    response.buffer(res.buffer, 'image/' + ext);
    return response;
}

async function wmtsLoadTileSets(nameStr: string, projection: Epsg | null): Promise<TileSet[]> {
    if (nameStr !== '' && nameStr[0] !== '@' && projection != null) {
        // single tileSet
        const ts = await loadTileSet(nameStr, projection);
        return ts == null ? [] : [ts];
    }

    return await loadTileSets(nameStr, projection);
}

export async function wmts(req: LambdaContext): Promise<LambdaHttpResponse> {
    const wmtsData = tileWmtsFromPath(req.action.rest);
    if (wmtsData == null) return NotFound;
    setNameAndProjection(req, wmtsData);
    const host = Env.get(Env.PublicUrlBase) ?? '';

    req.timer.start('tileset:load');
    const tileSets = await wmtsLoadTileSets(wmtsData.name, wmtsData.projection);
    req.timer.end('tileset:load');
    if (tileSets.length == 0) return NotFound;

    const provider = await Aws.tileMetadata.Provider.get(TileMetadataNamedTag.Production);
    if (provider == null) return NotFound;

    const tileMatrixSets = new Map<Epsg, TileMatrixSet>();
    if (wmtsData.projection == null) {
        for (const ts of tileSets) {
            const tiler = Tilers.get(ts.projection);
            if (tiler == null) return projectionNotFound(ts.projection);
            tileMatrixSets.set(ts.projection, tiler.tms);
        }
    } else {
        const tiler = Tilers.get(wmtsData.projection, wmtsData.altTms);
        if (tiler == null) return projectionNotFound(wmtsData.projection, wmtsData.altTms);
        tileMatrixSets.set(wmtsData.projection, tiler.tms);
    }

    const xml = WmtsCapabilities.toXml(host, provider, tileSets, tileMatrixSets, wmtsData.altTms, req.apiKey);
    if (xml == null) return NotFound;

    const data = Buffer.from(xml);

    const cacheKey = createHash('sha256').update(data).digest('base64');

    const respNotMod = checkNotModified(req, cacheKey);
    if (respNotMod != null) return respNotMod;

    const response = new LambdaHttpResponse(200, 'ok');
    response.header(HttpHeader.ETag, cacheKey);
    response.header(HttpHeader.CacheControl, 'max-age=0');
    response.buffer(data, 'text/xml');
    return response;
}

const SubHandler: Record<string, (req: LambdaContext) => Promise<LambdaHttpResponse>> = {
    'WMTSCapabilities.xml': wmts,
    'attribution.json': attribution,
};

export async function Tiles(req: LambdaContext): Promise<LambdaHttpResponse> {
    const { rest } = req.action;
    if (rest.length < 1) return NotFound;

    const subHandler = SubHandler[rest[rest.length - 1]];
    if (subHandler != null) {
        return subHandler(req);
    }

    return tile(req);
}
