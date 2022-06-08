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
    const res = new LambdaHttpResponse(200, 'ok');
    res.buffer(buf, extension);
    return res;
  } catch (e: any) {
    if (e.code === 404) return NotFound;
    throw e;
  }
}
