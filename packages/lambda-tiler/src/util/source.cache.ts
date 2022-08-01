import { fsa } from '@basemaps/shared';
import { CogTiff } from '@cogeotiff/core';
import { Cotar } from '@cotar/core';
import { St } from './source.tracer.js';
import { SwappingLru } from './swapping.lru.js';

export type LruStrut = LruStrutCotar | LruStrutCog;

export interface LruStrutCotar {
  type: 'cotar';
  value: Promise<Cotar>;
  _value?: Cotar;
}

export interface LruStrutCog {
  type: 'cog';
  value: Promise<CogTiff>;
  _value?: CogTiff;
}

class LruStrutObj<T extends LruStrut> {
  ob: T;
  constructor(ob: T) {
    this.ob = ob;
    if (this.ob._value == null) this.ob.value.then((c) => (this.ob._value = c));
  }
}

export class SourceCache {
  cache: SwappingLru<LruStrutObj<LruStrutCotar | LruStrutCog>>;
  constructor(maxSize: number) {
    this.cache = new SwappingLru<LruStrutObj<LruStrut>>(maxSize);
  }

  getCog(location: string): Promise<CogTiff> {
    const existing = this.cache.get(location)?.ob;

    if (existing != null) {
      if (existing.type === 'cog') return existing.value;
      throw new Error(`Existing object of type: ${existing.type} made for location: ${location}`);
    }
    const source = fsa.source(location);
    St.trace(source);
    const value = CogTiff.create(source);
    this.cache.set(location, new LruStrutObj({ type: 'cog', value }));
    return value;
  }

  getCotar(location: string): Promise<Cotar> {
    const existing = this.cache.get(location)?.ob;

    if (existing != null) {
      if (existing.type === 'cotar') return existing.value as Promise<Cotar>;
      throw new Error(`Existing object of type: ${existing.type} made for location: ${location}`);
    }
    const source = fsa.source(location);
    St.trace(source);
    const value = Cotar.fromTar(source);
    this.cache.set(location, new LruStrutObj({ type: 'cotar', value }));
    return value;
  }
}

/** Track the last 5,000 Sources so we don't have to re-init them */
export const CoSources = new SourceCache(5_000);
