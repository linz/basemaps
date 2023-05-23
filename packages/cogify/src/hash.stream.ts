import { BinaryToTextEncoding, createHash, Hash } from 'crypto';
import { Transform, TransformCallback } from 'stream';

export class HashTransform extends Transform {
  hash: Hash;
  hashType: string;
  size = 0;

  constructor(hashType: string) {
    super();
    this.hashType = hashType;
    this.hash = createHash(hashType);
  }
  _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
    this.hash.update(chunk);
    this.size += chunk.byteLength ?? chunk.length;
    callback(null, chunk);
  }

  digest(format: BinaryToTextEncoding): string {
    return this.hash.digest(format);
  }

  digestMultiHash(): string {
    if (this.hashType !== 'sha256') throw new Error('Invalid hashType requires "sha256" ' + this.hashType);
    // Create a multihash, 0x12: sha256, 0x20: 32 characters long
    return `1220` + this.digest('hex');
  }
}
