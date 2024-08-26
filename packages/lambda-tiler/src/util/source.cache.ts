import { Cotar, fsa, Tiff } from '@basemaps/shared';

import { SwappingLru } from './swapping.lru.js';

export type LruStrut = LruStrutCotar | LruStrutCog;

export interface LruStrutCotar {
  type: 'cotar';
  value: Promise<Cotar>;
  size: number;
}

export interface LruStrutCog {
  type: 'cog';
  value: Promise<Tiff>;
  size: number;
}

export class SourceCache {
  cache: SwappingLru<LruStrut>;
  constructor(maxSize: number) {
    this.cache = new SwappingLru<LruStrut>(maxSize);
  }

  getCog(location: URL): Promise<Tiff> {
    const existing = this.cache.get(location.href);

    if (existing != null) {
      if (existing.type === 'cog') return existing.value;
      throw new Error(`Existing object of type: ${existing.type} made for location: ${location.href}`);
    }
    const value = Tiff.create(fsa.source(location));
    this.cache.set(location.href, { type: 'cog', value, size: 1 });
    value.catch(() => this.cache.delete(location.href));
    return value;
  }

  getCotar(location: URL): Promise<Cotar> {
    const existing = this.cache.get(location.href);

    if (existing != null) {
      if (existing.type === 'cotar') return existing.value;
      throw new Error(`Existing object of type: ${existing.type} made for location: ${location.href}`);
    }
    const value = Cotar.fromTar(fsa.source(location));
    this.cache.set(location.href, { type: 'cotar', value, size: 1 });
    value.catch(() => this.cache.delete(location.href));
    return value;
  }
}

/** Cache the last 5,000 tiff/tar files accessed, generally it is only <100KB of memory used per tiff file so approx 50MB of cache */
export const CoSources = new SourceCache(5000);
