import baseX from 'base-x';
import { BinaryLike, createHash } from 'crypto';

const Base58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export const base58 = baseX(Base58);

/** Hash something with sha256 then encode it as a base58 text string */
export function sha256base58(obj: BinaryLike): string {
  return base58.encode(createHash('sha256').update(obj).digest());
}
