import { ChunkSource } from '@chunkd/core';
import { SwappingLru } from './swapping.lru.js';

export const ChunkCache = new SwappingLru<DataView>(1000); // Chunks are generally 64KB so 1000 * 64KB of storage

export class SharedSourceCache {
  source: ChunkSource;
  constructor(source: ChunkSource) {
    this.source = source;
  }
  get(chunkId: number): DataView | undefined {
    return ChunkCache.get(`${this.source.uri}@${chunkId}x${this.source.chunkSize}`);
  }

  has(chunkId: number): boolean {
    return ChunkCache.get(`${this.source.uri}@${chunkId}x${this.source.chunkSize}`) != null;
  }

  set(chunkId: number, value: DataView): void {
    return ChunkCache.set(`${this.source.uri}@${chunkId}x${this.source.chunkSize}`, value);
  }

  clear(): void {
    throw new Error('Cannot clear shared cache');
  }

  get size(): number {
    throw new Error('Cannot get size of shared cache');
  }
}
