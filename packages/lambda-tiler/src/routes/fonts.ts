import { Env } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import path from 'path';

interface FontGet {
  Params: { fontStack: string; range: string };
}

export async function fontGet(req: LambdaHttpRequest<FontGet>): Promise<LambdaHttpResponse> {
  const assetLocation = Env.get(Env.AssetLocation);
  if (assetLocation == null) return new LambdaHttpResponse(404, 'No Found');

  try {
    const filePath = fsa.join(assetLocation, path.join('fonts', req.params.fontStack, req.params.range)) + '.pbf';
    const buf = await fsa.read(filePath);
    const res = new LambdaHttpResponse(200, 'ok');
    res.buffer(buf, 'application/x-protobuf');
    return res;
  } catch (e: any) {
    if (e.code === 404) return new LambdaHttpResponse(404, 'No Found');
    throw e;
  }
}

export async function fontList(): Promise<LambdaHttpResponse> {
  const assetLocation = Env.get(Env.AssetLocation);
  if (assetLocation == null) return new LambdaHttpResponse(404, 'No Found');

  try {
    const filePath = fsa.join(assetLocation, '/fonts');
    const fonts = new Set<string>();

    // TODO use {recursive: false}
    for await (const fontPath of fsa.list(filePath)) {
      if (!fontPath.endsWith('.pbf')) continue;
      const basePath = fontPath.slice(filePath.length + 1);
      const dirName = path.dirname(basePath); // TODO this only works for /a/b.pbf and not /a/b/c.pbf
      if (dirName.includes('/')) continue;
      fonts.add(dirName);
    }

    const res = new LambdaHttpResponse(200, 'ok');
    res.buffer(JSON.stringify([...fonts].sort()), 'application/json');
    return res;
  } catch (e: any) {
    if (e.code === 404) return new LambdaHttpResponse(404, 'No Found');
    throw e;
  }
}
