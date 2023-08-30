import { GoogleTms, LocationUrl, TileMatrixSets } from '@basemaps/geo';
import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { ConfigLoader } from '../util/config.loader.js';
import { Env, fsa } from '@basemaps/shared';
import { isGzip } from '../util/cotar.serve.js';
import { gunzip } from 'node:zlib';
import { promisify } from 'node:util';

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

export async function previewIndexGet(req: LambdaHttpRequest<PreviewIndexGet>): Promise<LambdaHttpResponse> {
  const config = await ConfigLoader.load(req);

  const query = LocationUrl.parseQuery(req.query);

  req.timer.start('tileset:load');
  const tileSet = await config.TileSet.get(config.TileSet.id(query.style));
  req.timer.end('tileset:load');
  if (tileSet == null) return new LambdaHttpResponse(302, 'Invalid Tileset', { location: '/' });
  if (tileSet.type !== 'raster') return new LambdaHttpResponse(302, 'Invalid Tileset', { location: '/' });

  let tileMatrix = TileMatrixSets.find(query.tileMatrix);
  if (tileMatrix == null) tileMatrix = GoogleTms;

  const loc = LocationUrl.fromLocation(req.params.location);
  if (loc == null) return new LambdaHttpResponse(302, 'Invalid Location', { location: '/' });

  const short = LocationUrl.truncateLatLon(loc);
  const shortLocation = [short.zoom, short.lon, short.lat].join('/');

  const ogTags = new Map([
    ['og:title', `<meta property="og:title" content="LINZ Basemaps">`],
    ['og:description', `<meta property="og:description" content="${tileSet.title}" />`],
    [
      'og:image',
      `<meta property="og:image" content="/v1/preview/${tileSet.name}/${tileMatrix.identifier}/${shortLocation}" />`,
    ],
  ]);

  // If the static location is given to us replace
  const staticLocation = Env.get(Env.StaticAssetLocation);
  if (staticLocation != null) {
    let indexHtml = await fsa.read(fsa.join(staticLocation, 'index.html'));
    if (isGzip(indexHtml)) indexHtml = await gunzipP(indexHtml);

    // Replace open graph tags
    const output = String(indexHtml)
      .split('\n')
      .map((f) => {
        for (const [key, value] of ogTags.entries()) {
          if (f.includes(key)) return value;
        }
        return f;
      });

    const res = new LambdaHttpResponse(200, 'ok');
    res.buffer(output.join('\n'), `text/html; charset=utf-8`);
    return res;
  }

  const res = new LambdaHttpResponse(200, 'ok');

  // TODO replace actual index.html
  res.buffer(
    Buffer.from(`<!DOCTYPE html>
<html lang="en">
<head>
${[...ogTags.values()].join('\n')}
</head>
<script>
// 
</script>
<body>Would Redirect to '/#${req.params.location}?${req.query.toString()}'
<br /> Preview <br />
<img src="/v1/preview/${tileSet.name}/${
      tileMatrix.identifier
    }/${shortLocation}" width=1200 height=630 style="outline: 1px solid magenta"/>
</body>
</html>
  `),
    `text/html; charset=utf-8`,
  );
  return res;
}
