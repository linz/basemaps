import { Env, LogType } from '@basemaps/shared';
import { Client } from '@elastic/elasticsearch';

import { LogStats } from './log.stats.js';

export class ElasticClient {
  _client: Client | undefined;
  /** Between index requests delay this amount */
  indexDelay: number = 200;

  /**
   * Do not index analytics for buckets that contain less than this number of total requests
   *
   * @example
   * `1` - drop all requests where total requests <= 1
   *
   */
  minRequestCount: number = 1;

  get indexName(): string {
    const indexName = Env.get(Env.Analytics.ElasticIndexName);
    if (indexName == null) throw new Error(`$${Env.Analytics.ElasticIndexName} is unset`);
    return indexName;
  }

  get client(): Client {
    if (this._client != null) return this._client;

    const id = Env.getRequired(Env.Analytics.ElasticId);
    const apiKey = Env.getRequired(Env.Analytics.ElasticApiKey);

    this._client = new Client({ cloud: { id }, auth: { apiKey } });
    return this._client;
  }

  errors: unknown[] = [];
  insertQueue: Promise<void> = Promise.resolve();

  async insert(prefix: string, combined: Iterable<LogStats>, log: LogType): Promise<void> {
    this.insertQueue = this.insertQueue.then(() => this._doInsert(prefix, combined, log));
    return this.insertQueue;
  }

  async _doInsert(prefix: string, combined: Iterable<LogStats>, log: LogType): Promise<void> {
    const client = this.client;
    let inserts = 0;
    let skipHits = 0;
    let operations: unknown[] = [];

    const startTime = performance.now();

    const errors = this.errors;
    const indexDelay = this.indexDelay;
    const indexName = this.indexName;

    async function doInsert(): Promise<void> {
      inserts += operations.length / 2;
      log.trace({ prefix, records: operations.length / 2, skipHits, total: inserts }, 'log:ingest');
      const ret = await client.bulk({ operations });

      if (ret.errors) {
        errors.push({ prefix, errors: ret.errors });
        throw new Error('Failed to index: ' + prefix);
      }
      // Give it a little bit of time to index
      await new Promise((r) => setTimeout(r, indexDelay));
      operations = [];
    }

    for (const rec of combined) {
      // skip over roll ups that are less than
      if (rec.total <= this.minRequestCount) {
        skipHits++;
        continue;
      }
      operations.push({ index: { _index: indexName + '-' + rec['@timestamp'].slice(0, 4), _id: rec.id } }, rec);
      if (operations.length > 50_000) await doInsert();
    }

    if (operations.length > 0) await doInsert();

    if (inserts > 0) {
      log.info({ prefix, skipHits, total: inserts, duration: performance.now() - startTime }, 'log:ingest');
    } else {
      log.trace({ prefix }, 'log:ingest:skip');
    }
  }
}

export const Elastic = new ElasticClient();
