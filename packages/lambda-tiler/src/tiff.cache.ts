import { ChunkSourceBase } from '@chunkd/core';
import { CogTiff } from '@cogeotiff/core';

/** Limit the caching of tiffs */
export class TiffCache {
  static cacheA: Map<string, CogTiff> = new Map();
  static cacheB: Map<string, CogTiff> = new Map();

  /** 256 MB Cache */
  static MaxCacheSizeBytes = 256 * 1024 * 1024;

  static get(id: string): CogTiff | null {
    const cacheA = TiffCache.cacheA.get(id);
    if (cacheA) return cacheA;

    const cacheB = TiffCache.cacheB.get(id);
    if (cacheB == null) return null;
    // If a object is still useful move it into the main cache
    TiffCache.cacheA.set(id, cacheB);
    TiffCache.cacheB.delete(id);
    return cacheB;
  }

  /** Reset the cache */
  static clear(): void {
    this.cacheA.clear();
    this.cacheB.clear();
  }

  static set(id: string, tiff: CogTiff): void {
    TiffCache.cacheA.set(id, tiff);
  }

  /** Validate the size of the cache has not exploded */
  static check(): void {
    if (TiffCache.MaxCacheSizeBytes <= 0) return;
    if (TiffCache.currentSize <= TiffCache.MaxCacheSizeBytes) return;
    TiffCache.cacheB = TiffCache.cacheA;
    TiffCache.cacheA = new Map();
  }

  /** Calculate the total number of bytes used by this tiff cache */
  static get currentSize(): number {
    let size = 0;
    for (const value of TiffCache.cacheA.values()) {
      size += value.source.chunkSize * (value.source as ChunkSourceBase).chunks.size;
    }
    return size;
  }
}
