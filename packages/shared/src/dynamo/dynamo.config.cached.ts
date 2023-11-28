import { BaseConfig } from '@basemaps/config';

import { ConfigDynamoBase } from './dynamo.config.base.js';

export class ConfigDynamoCached<T extends BaseConfig> extends ConfigDynamoBase<T> {
  cache: Map<string, T> = new Map();

  public async get(id: string): Promise<T | null> {
    const queryKey = this.ensureId(id);
    let existing: T | null | undefined = this.cache.get(queryKey);
    if (existing == null) {
      existing = await super.get(queryKey);
      if (existing == null) return null;
      this.cache.set(queryKey, existing);
    }

    return existing;
  }

  public async getAll(ids: Set<string>): Promise<Map<string, T>> {
    const output = new Map<string, T>();
    const toFetch = new Set<string>();

    for (const id of ids) {
      const queryKey = this.ensureId(id);
      const existing = this.cache.get(queryKey);
      if (existing == null) {
        toFetch.add(queryKey);
      } else {
        output.set(queryKey, existing);
      }
    }

    if (toFetch.size > 0) {
      const res = await super.getAll(toFetch);
      for (const val of res.values()) {
        output.set(val.id, val);
        this.cache.set(val.id, val);
      }
    }
    return output;
  }
}
