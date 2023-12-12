import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';

import { assetProvider } from '../util/assets.provider.js';

interface FontGet {
  Params: { fontStack: string; range: string };
}

export async function fontGet(req: LambdaHttpRequest<FontGet>): Promise<LambdaHttpResponse> {
  const targetFile = `fonts/${req.params.fontStack}/${req.params.range}.pbf`;
  return assetProvider.serve(req, targetFile, 'application/x-protobuf');
}

export async function fontList(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  return assetProvider.serve(req, 'fonts/fonts.json', 'application/json');
}
