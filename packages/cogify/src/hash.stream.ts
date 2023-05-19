import { BinaryToTextEncoding, createHash, Hash } from 'crypto';
import { Transform, TransformCallback } from 'stream';

export class HashTransform extends Transform {
  hash: Hash;
  constructor(hashType: string) {
    super();
    this.hash = createHash(hashType);
  }
  _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
    this.hash.update(chunk);
    callback(null, chunk);
  }

  digest(format: BinaryToTextEncoding): string {
    return this.hash.digest(format);
  }
}
