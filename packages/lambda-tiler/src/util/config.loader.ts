import { base58, BasemapsConfigProvider, ConfigBundle, ConfigId, ConfigPrefix, isBase58 } from '@basemaps/config';
import { LambdaHttpResponse } from '@linzjs/lambda';
import { parseUri } from '@chunkd/core';
import { LambdaHttpRequest } from '@linzjs/lambda';
import { CachedConfig } from './config.cache.js';
import { Const, Env } from '@basemaps/shared';
import DynamoDb from 'aws-sdk/clients/dynamodb.js';

// FIXME load this from process.env COG BUCKETS?
const SafeBuckets = new Set(['linz-workflow-artifacts', 'linz-basemaps', 'linz-basemaps-staging']);
const SafeProtocols = new Set(['s3', 'memory']);

export const ConfigLoader = {
  defaultConfig: null as Promise<BasemapsConfigProvider> | null,

  // TODO it would be great to remove dynamoDb from our stack,
  // could config just be referenced using ${Env.ConfigLocation}
  Dynamo: {
    client: new DynamoDb({ region: Const.Aws.Region }),
    /** Load a configuration pointer from dynamoDb */
    async getConfig(id = 'latest'): Promise<null | ConfigBundle> {
      const item = await this.client
        .getItem({
          Key: { id: { S: ConfigId.prefix(ConfigPrefix.ConfigBundle, id) } },
          TableName: Const.TileMetadata.TableName,
        })
        .promise();

      if (item == null || item.Item == null) return null;
      return DynamoDb.Converter.unmarshall(item.Item) as ConfigBundle;
    },
    /** Set a configuration pointer into dynamoDB */
    async setConfig(record: ConfigBundle): Promise<string> {
      record.updatedAt = Date.now();
      await this.client
        .putItem({ TableName: Const.TileMetadata.TableName, Item: DynamoDb.Converter.marshall(record) })
        .promise();
      return record.id;
    },
  },

  async loadDefaultConfig(): Promise<BasemapsConfigProvider> {
    // Load a config set from the environment
    const configLocation = Env.get(Env.ConfigLocation);
    if (configLocation) {
      return CachedConfig.get(configLocation).then((f) => {
        if (f == null) throw new LambdaHttpResponse(404, `Config not found at ${configLocation}`);
        return f;
      });
    }

    // Load `cb_latest` from dynamodb then read the config from wherever its is pointing
    const cb = await ConfigLoader.Dynamo.getConfig('latest');
    if (cb == null) throw new LambdaHttpResponse(404, `Config not found at "cb_latest" or ${Env.ConfigLocation}`);
    return CachedConfig.get(cb.path).then((f) => {
      if (f == null) throw new LambdaHttpResponse(404, `Config not found at ${configLocation}`);
      return f;
    });
  },

  /** Exposed for testing */
  getDefaultConfig(): Promise<BasemapsConfigProvider> {
    if (this.defaultConfig == null) this.defaultConfig = this.loadDefaultConfig();
    return this.defaultConfig;
  },

  /** Lookup the config path from a request and return a standardized location */
  extract(req: LambdaHttpRequest): string | null {
    const rawLocation = req.query.get('config');
    if (rawLocation == null) return null;
    if (rawLocation.includes('/')) return base58.encode(Buffer.from(rawLocation));
    return rawLocation;
  },

  async load(req: LambdaHttpRequest): Promise<BasemapsConfigProvider> {
    const rawLocation = req.query.get('config');
    if (rawLocation == null) return this.getDefaultConfig();

    const configLocation = isBase58(rawLocation) ? Buffer.from(base58.decode(rawLocation)).toString() : rawLocation;

    const r = parseUri(configLocation);

    if (r == null) throw new LambdaHttpResponse(400, 'Invalid config location');
    if (!SafeProtocols.has(r.protocol)) {
      throw new LambdaHttpResponse(400, `Invalid configuration location protocol:${r.protocol}`);
    }
    if (!SafeBuckets.has(r.bucket)) {
      throw new LambdaHttpResponse(400, `Bucket: "${r.bucket}" is not a allowed bucket location`);
    }

    req.set('config', configLocation);
    req.timer.start('config:load');
    return CachedConfig.get(configLocation).then((f) => {
      req.timer.end('config:load');
      if (f == null) throw new LambdaHttpResponse(404, `Config not found at ${configLocation}`);
      return f;
    });
  },
};
