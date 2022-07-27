import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import path from 'path';
import { serveAssets } from '../util/assets.provider.js';

interface FontGet {
  Params: { fontStack: string; range: string };
}

export async function fontGet(req: LambdaHttpRequest<FontGet>): Promise<LambdaHttpResponse> {
  const targetFile = path.join('fonts', req.params.fontStack, req.params.range) + '.pbf';
  return serveAssets(req, targetFile, 'application/x-protobuf');
}

export async function fontList(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  return serveAssets(req, 'fonts.json', 'application/json');
}
