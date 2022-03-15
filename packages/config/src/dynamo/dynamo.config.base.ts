import DynamoDB from 'aws-sdk/clients/dynamodb.js';
import { BasemapsConfigObject } from '../base.config.js';
import { BaseConfig } from '../config/base.js';
import { ConfigPrefix } from '../config/prefix.js';
import { ConfigProviderDynamo } from './dynamo.config.js';

function toId(id: string): { id: { S: string } } {
  return { id: { S: id } };
}

export interface GetAllOptions {
  /** Should a error be thrown if not all records are returned */
  isAllRequired: boolean;
  /** Number of records to fetch in one getAll request */
  size: number;
}

const GetAllOptionDefaults: GetAllOptions = {
  isAllRequired: true,
  size: 100,
};

export class ConfigDynamoBase<T extends BaseConfig = BaseConfig> extends BasemapsConfigObject<T> {
  cfg: ConfigProviderDynamo;

  constructor(cfg: ConfigProviderDynamo, prefix: ConfigPrefix) {
    super(prefix);
    this.cfg = cfg;
  }

  private get db(): DynamoDB {
    return this.cfg.dynamo;
  }

  clone(rec: T): T {
    return DynamoDB.Converter.unmarshall(DynamoDB.Converter.marshall(rec)) as T;
  }

  public async get(key: string): Promise<T | null> {
    const item = await this.db.getItem({ Key: { id: { S: key } }, TableName: this.cfg.tableName }).promise();
    if (item == null || item.Item == null) return null;
    const obj = DynamoDB.Converter.unmarshall(item.Item) as BaseConfig;
    if (this.is(obj)) return obj;
    return null;
  }

  /** Get all records with the id */
  public async getAll(keys: Set<string>, opts?: Partial<GetAllOptions>): Promise<Map<string, T>> {
    let mappedKeys = Array.from(keys, toId);

    const output: Map<string, T> = new Map();

    const keySize = opts?.size ?? GetAllOptionDefaults.size;

    while (mappedKeys.length > 0) {
      const Keys = mappedKeys.length > keySize ? mappedKeys.slice(0, keySize) : mappedKeys;
      mappedKeys = mappedKeys.length > keySize ? mappedKeys.slice(keySize) : [];

      const items = await this.db.batchGetItem({ RequestItems: { [this.cfg.tableName]: { Keys } } }).promise();

      const metadataItems = items.Responses?.[this.cfg.tableName];
      if (metadataItems == null) throw new Error('Failed to fetch tile metadata');

      for (const row of metadataItems) {
        const item = DynamoDB.Converter.unmarshall(row) as BaseConfig;
        if (this.is(item)) output.set(item.id, item);
      }
    }

    const isAllRequired = opts?.isAllRequired ?? GetAllOptionDefaults.isAllRequired;
    if (isAllRequired && output.size < keys.size) {
      throw new Error(
        'Missing fetched items\n' +
          Array.from(keys.values())
            .filter((i) => !output.has(i))
            .join(', '),
      );
    }
    return output;
  }

  async put(record: T): Promise<string> {
    record.updatedAt = Date.now();
    await this.db.putItem({ TableName: this.cfg.tableName, Item: DynamoDB.Converter.marshall(record) }).promise();
    return record.id;
  }
}
