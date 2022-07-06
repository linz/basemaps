import { Env } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import path from 'path';
import { NotFound } from './response.js';

interface FontGet {
  Params: { fontStack: string; range: string };
}

export async function fontGet(req: LambdaHttpRequest<FontGet>): Promise<LambdaHttpResponse> {
  const assetLocation = Env.get(Env.AssetLocation);
  if (assetLocation == null) return NotFound;

  try {
    const fontStack = decodeURIComponent(req.params.fontStack);
    const filePath = fsa.join(assetLocation, path.join('fonts', fontStack, req.params.range)) + '.pbf';
    const buf = await fsa.read(filePath);

    return LambdaHttpResponse.ok().buffer(buf, 'application/x-protobuf');
  } catch (e: any) {
    if (e.code === 404) return NotFound;
    throw e;
  }
}

/** Get the unique name of folders is a path that contain .pbf files */
export async function getFonts(fontPath: string): Promise<string[]> {
  const fonts = new Set<string>();

  // TODO use {recursive: false}
  for await (const font of fsa.list(fontPath)) {
    if (!font.endsWith('.pbf')) continue;
    const dirName = path.basename(path.dirname(font)); // TODO this only works for /a/b.pbf and not /a/b/c.pbf
    if (dirName.includes('/')) continue;
    fonts.add(dirName);
  }
  // Ensure the fonts are alphabetical
  return [...fonts].sort();
}

export async function fontList(): Promise<LambdaHttpResponse> {
  const assetLocation = Env.get(Env.AssetLocation);
  if (assetLocation == null) return NotFound;

  try {
    const filePath = fsa.join(assetLocation, '/fonts');
    const fonts = await getFonts(filePath);

    return LambdaHttpResponse.ok().buffer(JSON.stringify(fonts), 'application/json');
  } catch (e: any) {
    if (e.code === 404) return NotFound;
    throw e;
  }
}
