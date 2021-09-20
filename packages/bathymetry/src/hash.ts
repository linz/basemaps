import * as crypto from 'crypto';
import * as fs from 'fs';
import Multihash from 'multihashes';

/** Stream a file though */
function hashFile(filePath: string, hashName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(hashName);
    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => reject(err));
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest()));
  });
}

/** Create a multihash of a file */
async function hash(filePath: string): Promise<string> {
  const hashData = await hashFile(filePath, 'sha256');
  return Buffer.from(Multihash.encode(hashData, 'sha2-256')).toString('hex');
}

export const Hash = { hash };
