import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import path from 'path';
import { assetProvider } from '../util/assets.provider.js';

interface FontGet {
  Params: { fontStack: string; range: string };
}

export async function fontGet(req: LambdaHttpRequest<FontGet>): Promise<LambdaHttpResponse> {
  const targetFile = path.join('fonts', req.params.fontStack, req.params.range) + '.pbf';
  return assetProvider.serve(req, targetFile, 'application/x-protobuf');
}

export async function fontList(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  return assetProvider.serve(req, 'fonts.json', 'application/json');
}
