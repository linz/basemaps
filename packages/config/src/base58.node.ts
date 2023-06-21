import { BinaryLike, createHash } from 'crypto';
import { base58, isBase58 } from './base58.js';

/** Hash something with sha256 then encode it as a base58 text string */
export function sha256base58(obj: BinaryLike): string {
  return base58.encode(createHash('sha256').update(obj).digest());
}

export function ensureBase58(s: null): null;
export function ensureBase58(s: string): string;
export function ensureBase58(s: string | null): string | null;
export function ensureBase58(s: string | null): string | null {
  if (s == null) return null;
  if (isBase58(s)) return s;
  return base58.encode(Buffer.from(s));
}

/**
 * Use the first # of bytes of result for the hash length
 * Base58 encodes sha256 into 44 Bytes ~5.8 bits / byte
 * 15 characters of output is 87 bits of randomness and creates a 16 character string
 */
const KeyHashLength = 15;
/** Hash the API key while keeping the type of the api key as prefix */
export function hashApiKey(k: string): string {
  return k.slice(0, 1) + sha256base58(k).slice(0, KeyHashLength);
}
