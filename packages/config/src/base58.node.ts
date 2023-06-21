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
