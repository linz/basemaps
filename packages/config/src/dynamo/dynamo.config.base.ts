import DynamoDB from 'aws-sdk/clients/dynamodb.js';
import { BaseConfigWriteableObject, BasemapsConfigObject } from '../base.config.js';
import { BaseConfig } from '../config/base.js';
import { ConfigPrefix } from '../config/prefix.js';
import { ConfigProviderDynamo } from './dynamo.config.js';

export type IdQuery = { id: { S: string } };
function toId(id: string): IdQuery {
  return { id: { S: id } };
}

export class ConfigDynamoBase<T extends BaseConfig = BaseConfig> extends BasemapsConfigObject<T> {
  cfg: ConfigProviderDynamo;

  constructor(cfg: ConfigProviderDynamo, prefix: ConfigPrefix) {
    super(prefix);
    this.cfg = cfg;
  }

  /** Ensure the ID is prefixed before querying */
  ensureId(id: string): string {
    if (id.startsWith(this.prefix)) return id;
    return `${this.prefix}_${id}`;
  }
  private get db(): DynamoDB {
    return this.cfg.dynamo;
  }

  isWriteable(): this is BaseConfigWriteableObject<T> {
    return true;
  }

  clone(rec: T): T {
    return DynamoDB.Converter.unmarshall(DynamoDB.Converter.marshall(rec)) as T;
  }

  public async get(key: string): Promise<T | null> {
    const item = await this.db
      .getItem({ Key: { id: { S: this.ensureId(key) } }, TableName: this.cfg.tableName })
      .promise();
    if (item == null || item.Item == null) return null;
    const obj = DynamoDB.Converter.unmarshall(item.Item) as BaseConfig;
    if (this.is(obj)) return obj;
    return null;
  }

  /** Get all records with the id */
  public async getAll(keys: Set<string>): Promise<Map<string, T>> {
    let mappedKeys: IdQuery[] = [];
    for (const key of keys) mappedKeys.push(toId(this.ensureId(key)));

    const output: Map<string, T> = new Map();

    while (mappedKeys.length > 0) {
      // Batch has a limit of 100 keys returned in a single get
      const Keys = mappedKeys.length > 100 ? mappedKeys.slice(0, 100) : mappedKeys;
      mappedKeys = mappedKeys.length > 100 ? mappedKeys.slice(100) : [];

      let RequestItems: DynamoDB.BatchGetRequestMap = { [this.cfg.tableName]: { Keys } };
      while (RequestItems != null && Object.keys(RequestItems).length > 0) {
        const items = await this.db.batchGetItem({ RequestItems }).promise();

        const metadataItems = items.Responses?.[this.cfg.tableName];
        if (metadataItems == null) throw new Error('Failed to fetch from ' + this.cfg.tableName);

        for (const row of metadataItems) {
          const item = DynamoDB.Converter.unmarshall(row) as BaseConfig;
          if (this.is(item)) output.set(item.id, item);
        }

        // Sometimes not all results will be returned on the first request
        RequestItems = items.UnprocessedKeys as DynamoDB.BatchGetRequestMap;
      }
    }

    return output;
  }

  async put(record: T): Promise<string> {
    record.updatedAt = Date.now();
    await this.db.putItem({ TableName: this.cfg.tableName, Item: DynamoDB.Converter.marshall(record) }).promise();
    return record.id;
  }
}
