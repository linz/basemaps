import { Env } from '@basemaps/shared';
import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import path from 'path';
import { serveAssets } from '../cotar.cache.js';
import { NotFound } from './response.js';

interface FontGet {
  Params: { fontStack: string; range: string };
}

export async function fontGet(req: LambdaHttpRequest<FontGet>): Promise<LambdaHttpResponse> {
  //TODO: Replace this with cb_.assets
  const assetLocation = Env.get(Env.AssetLocation);
  if (assetLocation == null) return NotFound;

  const fontStack = decodeURIComponent(req.params.fontStack);
  const targetFile = path.join('fonts', fontStack, req.params.range) + '.pbf';

  return await serveAssets(assetLocation, targetFile, 'application/x-protobuf');
}

export async function fontList(): Promise<LambdaHttpResponse> {
  //TODO: Replace this with cb_.assets
  const assetLocation = Env.get(Env.AssetLocation);
  if (assetLocation == null) return NotFound;
  return await serveAssets(assetLocation, 'fonts.json', 'application/json');
}
