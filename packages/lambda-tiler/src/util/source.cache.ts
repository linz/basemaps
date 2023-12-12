import { Cotar, fsa, Tiff } from '@basemaps/shared';

import { SwappingLru } from './swapping.lru.js';

export type LruStrut = LruStrutCotar | LruStrutCog;

export interface LruStrutCotar {
  type: 'cotar';
  value: Promise<Cotar>;
  _value?: Cotar;
}

export interface LruStrutCog {
  type: 'cog';
  value: Promise<Tiff>;
  _value?: Tiff;
}

class LruStrutObj<T extends LruStrut> {
  ob: T;
  constructor(ob: T) {
    this.ob = ob;
    if (this.ob._value == null) this.ob.value.then((c) => (this.ob._value = c));
  }

  size = 1;
}

export class SourceCache {
  cache: SwappingLru<LruStrutObj<LruStrutCotar | LruStrutCog>>;
  constructor(maxSize: number) {
    this.cache = new SwappingLru<LruStrutObj<LruStrut>>(maxSize);
  }

  getCog(location: URL): Promise<Tiff> {
    const existing = this.cache.get(location.href)?.ob;

    if (existing != null) {
      if (existing.type === 'cog') return existing.value;
      throw new Error(`Existing object of type: ${existing.type} made for location: ${location}`);
    }
    const value = Tiff.create(fsa.source(location));
    this.cache.set(location.href, new LruStrutObj({ type: 'cog', value }));
    return value;
  }

  getCotar(location: URL): Promise<Cotar> {
    const existing = this.cache.get(location.href)?.ob;

    if (existing != null) {
      if (existing.type === 'cotar') return existing.value as Promise<Cotar>;
      throw new Error(`Existing object of type: ${existing.type} made for location: ${location}`);
    }
    const value = Cotar.fromTar(fsa.source(location));
    this.cache.set(location.href, new LruStrutObj({ type: 'cotar', value }));
    return value;
  }
}

/** Cache the last 5,000 tiff/tar files accessed, generally it is only <100KB of memory used per tiff file so approx 50MB of cache */
export const CoSources = new SourceCache(5000);
