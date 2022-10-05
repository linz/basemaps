import { base58, BasemapsConfigProvider, isBase58 } from '@basemaps/config';
import { LambdaHttpResponse } from '@linzjs/lambda';
import { parseUri } from '@chunkd/core';
import { LambdaHttpRequest } from '@linzjs/lambda';
import { CachedConfig } from './config.cache.js';
import { getDefaultConfig } from '@basemaps/shared';

// FIXME load this from process.env COG BUCKETS?
const SafeBuckets = new Set(['linz-workflow-artifacts', 'linz-basemaps']);
const SafeProtocols = new Set(['s3', 'memory']);

export class ConfigLoader {
  /** Exposed for testing */
  static async getDefaultConfig(): Promise<BasemapsConfigProvider> {
    const config = getDefaultConfig();
    const cb = await config.ConfigBundle.get(config.ConfigBundle.id('latest'));
    if (cb == null) throw new LambdaHttpResponse(400, 'Unable to get lastest config bundle for asset.');
    config.assets = cb.asset;
    return config;
  }

  /** Lookup the config path from a request and return a standardized location */
  static extract(req: LambdaHttpRequest): string | null {
    const rawLocation = req.query.get('config');
    if (rawLocation == null) return null;
    if (rawLocation.includes('/')) return base58.encode(Buffer.from(rawLocation));
    return rawLocation;
  }

  static async load(req: LambdaHttpRequest): Promise<BasemapsConfigProvider> {
    const rawLocation = req.query.get('config');
    if (rawLocation == null) return this.getDefaultConfig();

    const configLocation = isBase58(rawLocation) ? Buffer.from(base58.decode(rawLocation)).toString() : rawLocation;

    const r = parseUri(configLocation);

    if (r == null) throw new LambdaHttpResponse(400, 'Invalid config location');
    if (!SafeProtocols.has(r.protocol)) {
      throw new LambdaHttpResponse(400, `Invalid configuration location protocol:${r.protocol}`);
    }
    if (!SafeBuckets.has(r.bucket)) {
      throw new LambdaHttpResponse(400, `Bucket: "${r.bucket}" is not a allowed bucket location`);
    }

    req.set('config', configLocation);
    req.timer.start('config:load');
    return CachedConfig.get(configLocation).then((f) => {
      req.timer.end('config:load');
      if (f == null) throw new LambdaHttpResponse(404, `Config not found at ${configLocation}`);
      return f;
    });
  }
}
