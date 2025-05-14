import { BasemapsConfigProvider, ConfigProviderMemory } from '@basemaps/config';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';

import { ConfigLoader } from '../util/config.loader.js';

function getConfigHash(cfg: BasemapsConfigProvider): { id: string; hash?: string } | undefined {
  if (!ConfigProviderMemory.is(cfg)) return undefined;
  if (cfg.id == null) return undefined;
  return { id: cfg.id, hash: cfg.hash };
}

export async function versionGet(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
  const config = await ConfigLoader.load(req);
  const response = new LambdaHttpResponse(200, 'ok');
  response.header(HttpHeader.CacheControl, 'no-store');
  response.json({
    /**
     * last git version tag
     * @example "v6.42.1"
     */
    version: process.env['GIT_VERSION'] ?? 'dev',

    /**
     * Full git commit hash
     * @example "e4231b1ee62c276c8657c56677ced02681dfe5d6"
     */
    hash: process.env['GIT_HASH'],

    /**
     *
     * The exact build that this release was run from
     * @example "1658821493-3"
     */
    buildId: process.env['BUILD_ID'],

    /**
     * Configuration id that was used to power this config
     * @example { "id": "cb_01JTQ7ZK49F8EY4N5DRJ3XFT73", hash: "HcByZ8WS2zpaTxFJp6wSKg2eUpwahLqAGEQdcDxKxqp6" }
     */
    config: getConfigHash(config),
  });

  return Promise.resolve(response);
}
