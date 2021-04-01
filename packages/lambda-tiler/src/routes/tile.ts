import { TileMatrixSet } from '@basemaps/geo';
import { HttpHeader, LambdaContext, LambdaHttpResponse, ValidateTilePath } from '@basemaps/lambda';
import {
    Aws,
    Env,
    setNameAndProjection,
    TileMetadataNamedTag,
    tileWmtsFromPath,
    tileXyzFromPath,
} from '@basemaps/shared';
import { TileMakerSharp } from '@basemaps/tiler-sharp';
import { createHash } from 'crypto';
import { TileSets } from '../tile.set.cache';
import { TileSetRaster } from '../tile.set.raster';
import { WmtsCapabilities } from '../wmts.capability';
import { attribution } from './attribution';
import { TileEtag } from './tile.etag';

export const TileComposer = new TileMakerSharp(256);

export const NotFound = new LambdaHttpResponse(404, 'Not Found');
export const NotModified = new LambdaHttpResponse(304, 'Not modified');

export async function tile(req: LambdaContext): Promise<LambdaHttpResponse> {
    const xyzData = tileXyzFromPath(req.action.rest);
    if (xyzData == null) return NotFound;
    ValidateTilePath.validate(req, xyzData);

    req.timer.start('tileset:load');
    const tileSet = await TileSets.get(xyzData.name, xyzData.tileMatrix);
    req.timer.end('tileset:load');
    if (tileSet == null) return NotFound;

    const res = await tileSet.tile(req, xyzData);
    return res;
}

async function wmtsLoadTileSets(name: string, tileMatrix: TileMatrixSet | null): Promise<TileSetRaster[]> {
    if (name !== '' && name[0] !== '@' && tileMatrix != null) {
        // single tileSet
        const ts = await TileSets.get(name, tileMatrix);
        if (ts == null || ts.type === 'vector') return [];
        return [ts];
    }

    return (await TileSets.getAll(name, tileMatrix)).filter((f) => f.type === 'raster') as TileSetRaster[];
}

export async function wmts(req: LambdaContext): Promise<LambdaHttpResponse> {
    const wmtsData = tileWmtsFromPath(req.action.rest);
    if (wmtsData == null) return NotFound;
    setNameAndProjection(req, wmtsData);
    const host = Env.get(Env.PublicUrlBase) ?? '';

    req.timer.start('tileset:load');
    const tileSets = await wmtsLoadTileSets(wmtsData.name, wmtsData.tileMatrix);
    req.timer.end('tileset:load');
    if (tileSets.length === 0) return NotFound;

    const provider = await Aws.tileMetadata.Provider.get(TileMetadataNamedTag.Production);
    if (provider == null) return NotFound;

    const xml = WmtsCapabilities.toXml(host, provider, tileSets, req.apiKey);
    if (xml == null) return NotFound;

    const data = Buffer.from(xml);

    const cacheKey = createHash('sha256').update(data).digest('base64');
    if (TileEtag.isNotModified(req, cacheKey)) return NotModified;

    const response = new LambdaHttpResponse(200, 'ok');
    response.header(HttpHeader.ETag, cacheKey);
    response.header(HttpHeader.CacheControl, 'max-age=0');
    response.buffer(data, 'text/xml');
    req.set('bytes', data.byteLength);
    return response;
}

export interface TileJson {
    tiles: string[];
    minzoom: number;
    maxzoom: number;
    format: string;
    tilejson: string;
}

export async function tileJson(req: LambdaContext): Promise<LambdaHttpResponse> {
    const { rest } = req.action;
    const host = Env.get(Env.PublicUrlBase) ?? '';
    const tileUrl = `${host}/${rest[0]}/${rest[1]}/{z}/{x}/{y}.pbf`;

    const tileJson: TileJson = {
        tiles: [tileUrl],
        minzoom: 0,
        maxzoom: 15,
        format: 'pbf',
        tilejson: '2.0.0',
    };

    const json = JSON.stringify(tileJson);

    const data = Buffer.from(json);

    const cacheKey = createHash('sha256').update(data).digest('base64');

    if (TileEtag.isNotModified(req, cacheKey)) return NotModified;

    const response = new LambdaHttpResponse(200, 'ok');
    response.header(HttpHeader.ETag, cacheKey);
    response.header(HttpHeader.CacheControl, 'max-age=120');
    response.buffer(data, 'application/json');
    req.set('bytes', data.byteLength);
    return response;
}

export async function Tiles(req: LambdaContext): Promise<LambdaHttpResponse> {
    const { rest } = req.action;
    if (rest.length < 1) return NotFound;

    const fileName = rest[rest.length - 1].toLowerCase();
    if (fileName === 'attribution.json') return attribution(req);
    if (fileName === 'wmtscapabilities.xml') return wmts(req);
    if (fileName === 'tile.json') return tileJson(req);
    return tile(req);
}
