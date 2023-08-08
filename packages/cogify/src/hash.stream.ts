import { createHash, Hash } from 'crypto';
import { Transform, TransformCallback } from 'stream';

export class HashTransform extends Transform {
  /** hash function in use */
  private hash: Hash;
  /** type of hash used @example "sha256" */
  hashType: string;
  /** Number of bytes processed */
  size = 0;
  /** digest of hash */
  private _digestHex: string | null;

  constructor(hashType: string) {
    super();
    this.hashType = hashType;
    this.hash = createHash(hashType);
  }

  _transform(chunk: Buffer, encoding: BufferEncoding, callback: TransformCallback): void {
    // Only update the hash if it has not been digested
    if (this._digestHex) return callback(new Error(`Conflict: Hash has already been digested`));

    this.hash.update(chunk);
    this.size += chunk.byteLength ?? chunk.length;
    callback(null, chunk);
  }

  /**
   * Digest the hash into a multihash
   *
   * once digested the hash cannot be updated.
   */
  get multihash(): string {
    if (this.hashType !== 'sha256') throw new Error('Invalid hashType requires "sha256" ' + this.hashType);
    return `1220` + this.digestHex;
  }

  get digestHex(): string {
    if (this._digestHex) return this._digestHex;
    this._digestHex = this.hash.digest('hex');
    return this._digestHex;
  }
}
