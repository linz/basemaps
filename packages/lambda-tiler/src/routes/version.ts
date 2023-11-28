import { HttpHeader, LambdaHttpResponse } from '@linzjs/lambda';

export async function versionGet(): Promise<LambdaHttpResponse> {
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
     * The exact build that this release was run from
     * @example "1658821493-3"
     */
    buildId: process.env['BUILD_ID'],
  });
  return response;
}
