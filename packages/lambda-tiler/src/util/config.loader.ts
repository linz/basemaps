import { BasemapsConfigProvider } from '@basemaps/config';
import { LambdaHttpResponse } from '@linzjs/lambda';
import { parseUri } from '@chunkd/core';
import { LambdaHttpRequest } from '@linzjs/lambda';
import { CachedConfig } from './config.cache.js';
import { getDefaultConfig } from '@basemaps/shared';

// FIXME load this from process.env COG BUCKETS?
const SafeBuckets = new Set(['linz-workflow-artifacts', 'linz-basemaps']);

export class ConfigLoader {
  static async load(req: LambdaHttpRequest): Promise<BasemapsConfigProvider> {
    const rawLocation = req.query.get('config');
    if (rawLocation == null) return getDefaultConfig();

    const configLocation = rawLocation.startsWith('s3://')
      ? rawLocation
      : Buffer.from(rawLocation, 'base64url').toString();

    const r = parseUri(configLocation);
    if (r == null) throw new LambdaHttpResponse(400, 'Invalid config location');
    if (r.protocol !== 's3') throw new LambdaHttpResponse(400, `Invalid configuration location protocol:${r.protocol}`);
    if (SafeBuckets.has(r.bucket)) {
      throw new LambdaHttpResponse(400, `Bucket: "${r.bucket}" is not a allowed bucket location`);
    }

    req.set('config', configLocation);
    req.timer.start('config:load');
    return CachedConfig.get(configLocation).then((f) => {
      req.timer.end('config:load');
      if (f == null) throw new LambdaHttpResponse(400, `Invalid config location`);
      return f;
    });
  }
}
