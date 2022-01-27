import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { isValidApiKey } from '../api.key.js';
import { Router } from '../router.js';
import { attribution } from './attribution.js';
import { NotFound } from './response.js';
import { tileJson } from './tile.json.js';
import { styleJson } from './tile.style.json.js';
import { wmts } from './tile.wmts.js';
import { tileXyz } from './tile.xyz.js';

export async function Tiles(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  const { rest } = Router.action(req);
  if (rest.length < 1) return NotFound;
  const apiKey = Router.apiKey(req);
  if (!isValidApiKey(apiKey)) return new LambdaHttpResponse(400, 'Invalid API Key');

  const fileName = rest[rest.length - 1].toLowerCase();
  if (fileName === 'attribution.json') return attribution(req);
  if (fileName === 'wmtscapabilities.xml') return wmts(req);
  if (fileName === 'tile.json') return tileJson(req);
  if (fileName.endsWith('json') && rest[rest.length - 2] === 'style') return styleJson(req, fileName);
  return tileXyz(req);
}
