import { fsa } from '@basemaps/shared';
import { ChunkSourceBase } from '@chunkd/core';
import { CogTiff } from '@cogeotiff/core';
import { Cotar } from '@cotar/core';
import { St } from './source.tracer';
import { SwappingLru } from './swapping.lru';

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

class LruStrutObj<T extends LruStrut = LruStrut> {
  type: T['type'];
  value: T['value'];
  /** The value if it exists */
  _value: T['_value'];

  constructor(type: T['type'], value: T['value']) {
    this.type = type;
    this.value = value;
    value.then((c) => (this._value = c));
  }

  get size(): number {
    if (this._value == null) return 0;
    return this._value.source.chunkSize * (this._value.source as ChunkSourceBase).chunks.size;
  }
}

export class SourceCache {
  cache: SwappingLru<LruStrutObj<LruStrut>>;
  constructor(maxSize: number) {
    this.cache = new SwappingLru<LruStrutObj>(maxSize);
  }

  getCog(location: string): Promise<CogTiff> {
    const existing = this.cache.get(location);

    if (existing != null) {
      if (existing.type === 'cog') return existing.value as Promise<CogTiff>;
      throw new Error(`Existing object of type: ${existing.type} made for location: ${location}`);
    }
    const source = fsa.source(location);
    St.trace(source);
    const value = CogTiff.create(source);
    this.cache.set(location, new LruStrutObj('cog', this.getCotar(location)));
    return value;
  }

  getCotar(location: string): Promise<Cotar> {
    const existing = this.cache.get(location);

    if (existing != null) {
      if (existing.type === 'cog') return existing.value as Promise<Cotar>;
      throw new Error(`Existing object of type: ${existing.type} made for location: ${location}`);
    }
    const source = fsa.source(location);
    St.trace(source);
    const value = Cotar.fromTar(source);
    this.cache.set(location, new LruStrutObj('cotar', value));
    return value;
  }
}

export const CoSources = new SourceCache(256 * 1024 * 1024);
