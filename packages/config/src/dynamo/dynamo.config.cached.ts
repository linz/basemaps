import { GetAllOptions } from '../base.config.js';
import { BaseConfig } from '../config/base.js';
import { ConfigDynamoBase } from './dynamo.config.base.js';

export class ConfigDynamoCached<T extends BaseConfig> extends ConfigDynamoBase<T> {
  cache: Map<string, T> = new Map();

  public async get(id: string): Promise<T | null> {
    let existing: T | null | undefined = this.cache.get(id);
    if (existing == null) {
      existing = await super.get(id);
      if (existing == null) return null;
      this.cache.set(id, existing);
    }

    return existing;
  }

  public async getAll(ids: Set<string>, opts?: Partial<GetAllOptions>): Promise<Map<string, T>> {
    const output = new Map<string, T>();
    const toFetch = new Set<string>();

    for (const id of ids) {
      const existing = this.cache.get(id);
      if (existing == null) {
        toFetch.add(id);
      } else {
        output.set(id, existing);
      }
    }

    if (toFetch.size > 0) {
      const res = await super.getAll(toFetch, opts);
      for (const val of res.values()) {
        output.set(val.id, val);
        this.cache.set(val.id, val);
      }
    }
    return output;
  }
}
