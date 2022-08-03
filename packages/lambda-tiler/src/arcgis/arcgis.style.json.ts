import { Config, Sources, StyleJson, TileSetType } from '@basemaps/config';
import { Env, fsa } from '@basemaps/shared';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { convertRelativeUrl } from '../routes/tile.style.json.js';
import { Etag } from '../util/etag.js';
import { NotFound, NotModified } from '../util/response.js';
import { Validate } from '../util/validate.js';

interface StyleGet {
  Params: {
    tileSet: string;
  };
}

function tileserverUrl(tileSet: string, apiKey: string): string {
  const host = Env.get(Env.PublicUrlBase) ?? '';
  const url = `/v1/arcgis/rest/services/${tileSet}/VectorTileServer`;
  const fullUrl = new URL(fsa.join(host, url));
  fullUrl.searchParams.set('api', apiKey);
  fullUrl.searchParams.set('f', 'json');
  return fullUrl.toString().replace(/%7B/g, '{').replace(/%7D/g, '}');
}

function convertStyleJson(tileSet: string, style: StyleJson, apiKey: string): StyleJson {
  const sources: Sources = JSON.parse(JSON.stringify(style.sources));
  // Only keep the vector layer and update the source url
  for (const [key, value] of Object.entries(sources)) {
    if (value.type === 'vector') {
      value.url = tileserverUrl(tileSet, apiKey);
      sources[key] = value;
    } else {
      delete sources[key];
    }
  }

  // Remove all the not vector layers.
  const layers = [];
  for (const layer of style.layers) {
    if (layer.source != null && !sources.hasOwnProperty(layer.source)) continue;
    layers.push(layer);
  }

  return {
    version: 8,
    id: style.id,
    name: style.name,
    sources,
    layers,
    metadata: style.metadata ?? {},
    glyphs: convertRelativeUrl(style.glyphs),
    sprite: convertRelativeUrl(style.sprite),
  } as StyleJson;
}

export async function arcgisStyleJsonGet(req: LambdaHttpRequest<StyleGet>): Promise<LambdaHttpResponse> {
  const apiKey = Validate.apiKey(req);
  const tileSet = await Config.TileSet.get(Config.TileSet.id(req.params.tileSet));
  if (tileSet?.type !== TileSetType.Vector) return NotFound();

  const style = req.query.get('style');
  const styleName = style ? style : 'topographic'; // Defalut to topographic style

  // Get style Config from db
  const dbId = Config.Style.id(styleName);
  const styleConfig = await Config.Style.get(dbId);
  if (styleConfig == null) return NotFound();

  // Prepare sources and add linz source
  const styleJson = convertStyleJson(tileSet.name, styleConfig.style, apiKey);
  const data = Buffer.from(JSON.stringify(styleJson));

  const cacheKey = Etag.key(data);
  if (Etag.isNotModified(req, cacheKey)) return NotModified();

  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.ETag, cacheKey);
  response.header(HttpHeader.CacheControl, 'no-store');
  response.buffer(data, 'application/json');
  req.set('bytes', data.byteLength);
  return response;
}
