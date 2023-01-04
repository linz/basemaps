import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import path from 'path';
import { assetProvider } from '../util/assets.provider.js';
import { NotFound } from '../util/response.js';

interface FontGet {
  Params: { fontStack: string; range: string };
}

export async function fontGet(req: LambdaHttpRequest<FontGet>): Promise<LambdaHttpResponse> {
  const targetFonts = req.params.fontStack.split(',');
  for (const font of targetFonts) {
    const targetFile = path.join('fonts', font, req.params.range) + '.pbf';
    const response = await assetProvider.serve(req, targetFile, 'application/x-protobuf');
    if (response.status !== 404) return assetProvider.serve(req, targetFile, 'application/x-protobuf');
  }
  return NotFound();
}

export async function fontList(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  return assetProvider.serve(req, path.join('fonts', 'fonts.json'), 'application/json');
}
