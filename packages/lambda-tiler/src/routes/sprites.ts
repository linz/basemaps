import { fsa } from '@chunkd/fs';
import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import path from 'path';

import { assetProvider } from '../util/assets.provider.js';
import { NotFound } from '../util/response.js';

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
  return assetProvider.serve(req, targetFile, mimeType);
}
