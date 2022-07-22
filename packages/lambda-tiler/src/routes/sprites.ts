import { Env } from '@basemaps/shared';
import path from 'path';
import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { NotFound } from './response.js';
import { serveAssets } from '../cotar.cache.js';
import { fsa } from '@chunkd/fs';

interface SpriteGet {
  Params: {
    spriteName: string;
  };
}

const Extensions = new Map();
Extensions.set('.png', 'image/png');
Extensions.set('.json', 'application/json');

export async function spriteGet(req: LambdaHttpRequest<SpriteGet>): Promise<LambdaHttpResponse> {
  //TODO: Replace this with cb_.assets
  const assetLocation = Env.get(Env.AssetLocation);
  if (assetLocation == null) return NotFound;

  const extension = path.extname(req.params.spriteName);
  const mimeType = Extensions.get(extension);
  if (mimeType == null) return NotFound;

  const targetFile = fsa.join('sprites', req.params.spriteName);
  return serveAssets(assetLocation, targetFile, mimeType);
}
