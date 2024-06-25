import * as crypto from 'crypto';
import * as fs from 'fs';

/** Stream a file though */
function hashFile(filePath: string, hashName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(hashName);
    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => reject(err));
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

/** Create a multihash of a file */
async function hash(filePath: string): Promise<string> {
  const hashData = await hashFile(filePath, 'sha256');
  // 0x12 - sha256
  // 0x20 - 32bytes
  return '1220' + hashData;
}

export const Hash = { hash };
