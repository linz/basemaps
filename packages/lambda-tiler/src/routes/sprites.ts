import { Env } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import path from 'path';
import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { NotFound } from './response.js';

interface SpriteGet {
  Params: {
    spriteName: string;
  };
}

const Extensions = new Map();
Extensions.set('.png', 'image/png');
Extensions.set('.json', 'application/json');

/**
 * Does a buffer look like a gzipped document instead of raw json
 *
 * Determined by checking the first two bytes are the gzip magic bytes `0x1f 0x8b`
 *
 * @see https://en.wikipedia.org/wiki/Gzip
 *
 */
function isGzip(b: Buffer): boolean {
  return b[0] === 0x1f && b[1] === 0x8b;
}

export async function spriteGet(req: LambdaHttpRequest<SpriteGet>): Promise<LambdaHttpResponse> {
  const spriteLocation = Env.get(Env.AssetLocation);
  if (spriteLocation == null) return NotFound;

  const extension = path.extname(req.params.spriteName);
  const mimeType = Extensions.get(extension);
  if (mimeType == null) return NotFound;

  try {
    const filePath = fsa.join(spriteLocation, fsa.join('/sprites', req.params.spriteName));
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
