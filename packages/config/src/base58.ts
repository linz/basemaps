/** This file is able to be directly imported in the web, soo all nodejs logic is in ./base58.node.ts */
import baseX from 'base-x';

const Base58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export const base58 = baseX(Base58);

const Base58ValidCharacters = new Set(Base58);

export function isBase58(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    if (!Base58ValidCharacters.has(s.charAt(i))) return false;
  }
  return true;
}
