import { promisify } from 'node:util';
import { gunzip } from 'node:zlib';

import { TileSetType } from '@basemaps/config';
import { GoogleTms, LocationUrl, LonLatZoom, TileMatrixSets } from '@basemaps/geo';
import { Env, fsa, getPreviewQuery } from '@basemaps/shared';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';

import { ConfigLoader } from '../util/config.loader.js';
import { isGzip } from '../util/cotar.serve.js';
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
 * @param loc location of the request if valid
 * @param tags tags to replace if they exist
 *
 * @returns response containing the output HTML
 */
export async function loadAndServeIndexHtml(
  req: LambdaHttpRequest,
  loc?: LonLatZoom | null,
  tags?: Map<string, string>,
): Promise<LambdaHttpResponse> {
  const locUrl = loc ? `#` + LocationUrl.toSlug(loc) : '';
  // If the static location is given to us replace
  const staticLocation = Env.get(Env.StaticAssetLocation);
  // No static assets defined, just redirect back to the main page
  if (staticLocation == null) {
    return new LambdaHttpResponse(302, 'Invalid index.html', {
      location: '/?' + req.query.toString() + locUrl,
    });
  }

  const staticUrl = fsa.toUrl(staticLocation);

  try {
    let indexHtml = await fsa.read(new URL('index.html', staticUrl));
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
  } catch (e) {
    req.log.fatal({ e }, 'Index:Failed');
    // If we fail to read transform the index, just redirect the user to the actual index.html
    return new LambdaHttpResponse(302, 'Failed to render index.html', {
      location: '/?' + req.query.toString() + locUrl,
    });
  }
}

export async function previewIndexGet(req: LambdaHttpRequest<PreviewIndexGet>): Promise<LambdaHttpResponse> {
  const config = await ConfigLoader.load(req);
  const loc = LocationUrl.fromSlug(req.params.location);
  if (loc == null) return loadAndServeIndexHtml(req);

  const query = LocationUrl.parseQuery(req.query);

  req.timer.start('tileset:load');
  const tileSet = await config.TileSet.get(config.TileSet.id(query.style));
  req.timer.end('tileset:load');
  if (tileSet == null) return loadAndServeIndexHtml(req, loc);
  if (tileSet.type !== TileSetType.Raster) return loadAndServeIndexHtml(req, loc);

  let tileMatrix = TileMatrixSets.find(query.tileMatrix);
  if (tileMatrix == null) tileMatrix = GoogleTms;

  const short = LocationUrl.truncateLatLon(loc);
  const shortLocation = [short.zoom, short.lon, short.lat].join('/');

  const cfg = ConfigLoader.extract(req);
  const queryParams = getPreviewQuery({ config: cfg, pipeline: query.pipeline ?? tileSet.outputs?.[0]?.name });

  // Include tile matrix name eg "[NZTM2000Quad]" in the title if its not WebMercatorQuad
  const tileMatrixId = tileMatrix.identifier === GoogleTms.identifier ? '' : ` [${tileMatrix.identifier}]`;
  // List of tags to replace in the index.html
  const ogTags = new Map([
    ['og:title', `<meta name="twitter:title" property="og:title" content="LINZ Basemaps">`],
    // TODO attribution could be used to get exactly what imagery is being looked at.
    [
      'og:description',
      `<meta name="twitter:description" property="og:description" content="${tileSet.title}${tileMatrixId}" />`,
    ],
    [
      'og:image',
      `<meta name="twitter:image" property="og:image" content="/v1/preview/${tileSet.name}/${tileMatrix.identifier}/${shortLocation}${queryParams}" />`,
    ],
  ]);

  return loadAndServeIndexHtml(req, loc, ogTags);
}
