import { GoogleTms, LocationUrl, TileMatrixSets } from '@basemaps/geo';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { ConfigLoader } from '../util/config.loader.js';
import { Env, fsa } from '@basemaps/shared';
import { isGzip } from '../util/cotar.serve.js';
import { gunzip } from 'node:zlib';
import { promisify } from 'node:util';
import { Etag } from '../util/etag.js';

const gunzipP = promisify(gunzip);

export interface PreviewIndexGet {
  Params: {
    location: string;
  };
  Query: {
    config?: string;
    style?: string;
    tileMatrix?: string;
  };
}

/**
 * Load the `index.html` from the static bucket and replace `<meta />` tags with the preview open graph tags
 *
 * @param tags tags to replace if they exist
 *
 * @returns response containing the output HTML
 */
async function loadAndServeIndexHtml(req: LambdaHttpRequest, tags?: Map<string, string>): Promise<LambdaHttpResponse> {
  // If the static location is given to us replace
  const staticLocation = Env.get(Env.StaticAssetLocation);
  // No static assets defined, just redirect back to the main page
  if (staticLocation == null)
    return new LambdaHttpResponse(302, 'invalid index.html', {
      location: '/?' + req.query.toString() + '#' + req.url,
    });
  let indexHtml = await fsa.read(fsa.join(staticLocation, 'index.html'));
  if (isGzip(indexHtml)) indexHtml = await gunzipP(indexHtml);

  const res = new LambdaHttpResponse(200, 'ok');
  // These index.html documents are refreshed frequently so only let them be cached for short durations
  res.header(HttpHeader.CacheControl, 'public, max-age=30, stale-while-revalidate=60');

  if (tags == null) {
    res.header(HttpHeader.ETag, Etag.key(indexHtml));
    res.buffer(indexHtml, `text/html; charset=utf-8`);
    return res;
  }

  // Replace open graph tags
  const output = String(indexHtml)
    .split('\n')
    .map((f) => {
      for (const [key, value] of tags.entries()) {
        if (f.includes(key)) return value;
      }
      return f;
    });

  const outHtml = output.join('\n');
  res.header(HttpHeader.ETag, Etag.key(outHtml));
  res.buffer(outHtml, `text/html; charset=utf-8`);
  return res;
}

export async function previewIndexGet(req: LambdaHttpRequest<PreviewIndexGet>): Promise<LambdaHttpResponse> {
  const config = await ConfigLoader.load(req);

  const query = LocationUrl.parseQuery(req.query);

  req.timer.start('tileset:load');
  const tileSet = await config.TileSet.get(config.TileSet.id(query.style));
  req.timer.end('tileset:load');
  if (tileSet == null) return loadAndServeIndexHtml(req);
  if (tileSet.type !== 'raster') return loadAndServeIndexHtml(req);

  let tileMatrix = TileMatrixSets.find(query.tileMatrix);
  if (tileMatrix == null) tileMatrix = GoogleTms;

  const loc = LocationUrl.fromLocation(req.params.location);
  if (loc == null) return loadAndServeIndexHtml(req);

  const short = LocationUrl.truncateLatLon(loc);
  const shortLocation = [short.zoom, short.lon, short.lat].join('/');

  // List of tags to replace in the index.html
  const ogTags = new Map([
    ['og:title', `<meta property="og:title" content="LINZ Basemaps">`],
    // TODO attribution could be used to get exactly what imagery is being looked at.
    ['og:description', `<meta property="og:description" content="${tileSet.title}" />`],
    [
      'og:image',
      `<meta property="og:image" content="/v1/preview/${tileSet.name}/${tileMatrix.identifier}/${shortLocation}" />`,
    ],
  ]);

  return loadAndServeIndexHtml(req, ogTags);
}
