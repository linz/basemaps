import { Tile, TileMatrixSet } from '@basemaps/geo';
import { HttpHeader, LambdaContext, LambdaHttpResponse, ValidateTilePath } from '@basemaps/lambda';
import { Aws, Env, TileDataWmts, TileDataXyz, tileFromPath, TileMetadataTag, TileType } from '@basemaps/shared';
import { TileMakerSharp } from '@basemaps/tiler-sharp';
import { CogTiff } from '@cogeotiff/core';
import { createHash } from 'crypto';
import pLimit from 'p-limit';
import { TileSet } from '../tile.set';
import { loadTileSet, loadTileSets } from '../tile.set.cache';
import { Tilers } from '../tiler';
import { WmtsCapabilities } from '../wmts.capability';
import { TileEtag } from './tile.etag';

export const TileComposer = new TileMakerSharp(256);
const LoadingQueue = pLimit(Env.getNumber(Env.TiffConcurrency, 5));

/** Background color of tiles where the tileset does not define a color */
const DefaultBackground = { r: 0, g: 0, b: 0, alpha: 0 };

const NotFound = new LambdaHttpResponse(404, 'Not Found');

/** Initialize the tiffs before reading */
async function initTiffs(tileSet: TileSet, tms: TileMatrixSet, tile: Tile, ctx: LambdaContext): Promise<CogTiff[]> {
    const tiffs = tileSet.getTiffsForTile(tms, tile);
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

export async function tile(req: LambdaContext, xyzData: TileDataXyz): Promise<LambdaHttpResponse> {
    const tiler = Tilers.get(xyzData.projection);
    if (tiler == null) return new LambdaHttpResponse(404, `Projection not found: ${xyzData.projection.code}`);

    const { x, y, z, ext } = xyzData;

    req.timer.start('tileset:load');
    const tileSet = await loadTileSet(xyzData.name, xyzData.projection);
    req.timer.end('tileset:load');
    if (tileSet == null) return new LambdaHttpResponse(404, 'Tileset Not Found');

    const tiffs = await initTiffs(tileSet, tiler.tms, xyzData, req);
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

    req.set('bytes', res.buffer.byteLength);
    const response = new LambdaHttpResponse(200, 'ok');
    response.header(HttpHeader.ETag, cacheKey);
    response.buffer(res.buffer, 'image/' + ext);
    return response;
}

export async function wmts(req: LambdaContext, wmtsData: TileDataWmts): Promise<LambdaHttpResponse> {
    const response = new LambdaHttpResponse(200, 'ok');

    const host = Env.get(Env.PublicUrlBase) ?? '';

    req.timer.start('tileset:load');
    const tileSets = await loadTileSets(wmtsData.name, wmtsData.projection);
    req.timer.end('tileset:load');
    if (tileSets.length == 0) return NotFound;

    const provider = await Aws.tileMetadata.Provider.get(TileMetadataTag.Production);
    if (provider == null) return NotFound;

    const xml = WmtsCapabilities.toXml(host, provider, tileSets, req.apiKey);
    if (xml == null) return NotFound;

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
    if (xyzData == null) return NotFound;

    req.set('tileSet', xyzData.name);
    req.set('projection', xyzData.projection);

    if (xyzData.type === TileType.WMTS) {
        return wmts(req, xyzData);
    } else {
        ValidateTilePath.validate(req, xyzData);
        return tile(req, xyzData);
    }
}
