import { base58, BasemapsConfigProvider, isBase58 } from '@basemaps/config';
import { fsa, getDefaultConfig } from '@basemaps/shared';
import { LambdaHttpResponse } from '@linzjs/lambda';
import { LambdaHttpRequest } from '@linzjs/lambda';

import { CachedConfig } from './config.cache.js';

// TODO load this from process.env COG BUCKETS?
const SafeBuckets = new Set([
  'linz-workflows-scratch',
  'linz-workflow-artifacts',
  'linz-basemaps',
  'linz-basemaps-staging',
  'linz-basemaps-scratch',
]);

const SafeProtocols = new Set([new URL('s3://foo').protocol, new URL('memory://foo.json').protocol]);

export class ConfigLoader {
  /** Exposed for testing */
  static async getDefaultConfig(): Promise<BasemapsConfigProvider> {
    const config = getDefaultConfig();
    if (config.assets == null) {
      const cb = await config.ConfigBundle.get(config.ConfigBundle.id('latest'));
      if (cb) config.assets = cb.assets;
    }
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
    const configUrl = fsa.toUrl(configLocation);

    if (configUrl == null) throw new LambdaHttpResponse(400, 'Invalid config location');
    if (!SafeProtocols.has(configUrl.protocol)) {
      throw new LambdaHttpResponse(400, `Invalid configuration location protocol:${configUrl.protocol}`);
    }
    if (!SafeBuckets.has(configUrl.hostname)) {
      throw new LambdaHttpResponse(400, `Bucket: "${configUrl.hostname}" is not a allowed bucket location`);
    }

    req.set('config', configUrl.href);
    req.timer.start('config:load');
    return CachedConfig.get(configUrl).then((f) => {
      req.timer.end('config:load');
      if (f == null) throw new LambdaHttpResponse(400, `Invalid config location at ${configLocation}`);
      return f;
    });
  }
}
