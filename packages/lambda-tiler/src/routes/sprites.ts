import { fsa } from '@chunkd/fs';
import path from 'path';
import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { NotFound } from '../util/response.js';
import { serveAssets } from '../util/assets.provider.js';

interface SpriteGet {
  Params: {
    spriteName: string;
  };
}

const Extensions = new Map();
Extensions.set('.png', 'image/png');
Extensions.set('.json', 'application/json');

export async function spriteGet(req: LambdaHttpRequest<SpriteGet>): Promise<LambdaHttpResponse> {
  const extension = path.extname(req.params.spriteName);
  const mimeType = Extensions.get(extension);
  if (mimeType == null) return NotFound();

  const targetFile = fsa.join('sprites', req.params.spriteName);
  return serveAssets(req, targetFile, mimeType);
}
