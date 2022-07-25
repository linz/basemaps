import { Env } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import path from 'path';
import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { NotFound } from '../util/response.js';
import { isGzip, serveFromCotar } from '../util/cotar.serve.js';

interface SpriteGet {
  Params: {
    spriteName: string;
  };
}

const Extensions = new Map();
Extensions.set('.png', 'image/png');
Extensions.set('.json', 'application/json');

export async function spriteGet(req: LambdaHttpRequest<SpriteGet>): Promise<LambdaHttpResponse> {
  const assetLocation = Env.get(Env.AssetLocation);
  if (assetLocation == null) return NotFound;

  const extension = path.extname(req.params.spriteName);
  const mimeType = Extensions.get(extension);
  if (mimeType == null) return NotFound;

  const targetFile = fsa.join('sprites', req.params.spriteName);
  if (assetLocation.endsWith('.tar.co')) return serveFromCotar(assetLocation, targetFile, mimeType);

  try {
    const filePath = fsa.join(assetLocation, targetFile);
    req.set('target', filePath);

    const buf = await fsa.read(filePath);
    const res = LambdaHttpResponse.ok().buffer(buf, mimeType);
    if (isGzip(buf)) res.header('content-encoding', 'gzip');
    return res;
  } catch (e: any) {
    if (e.code === 404) return NotFound;
    throw e;
  }
}
