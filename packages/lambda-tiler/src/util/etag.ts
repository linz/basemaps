import { sha256base58 } from '@basemaps/config';
import { HttpHeader, LambdaHttpRequest } from '@linzjs/lambda';

export const Etag = {
  key(obj: Record<string, unknown> | Buffer | string): string {
    if (Buffer.isBuffer(obj) || typeof obj === 'string') return sha256base58(obj);
    return sha256base58(JSON.stringify(obj));
  },

  isNotModified(req: LambdaHttpRequest, cacheKey: string): boolean {
    // If the user has supplied a IfNoneMatch Header and it contains the full sha256 sum for our
    // etag this tile has not been modified.
    const ifNoneMatch = req.header(HttpHeader.IfNoneMatch);
    if (ifNoneMatch != null && ifNoneMatch.indexOf(cacheKey) > -1) {
      req.set('cache', { hit: true, match: ifNoneMatch });
      return true;
    }
    return false;
  },
};
