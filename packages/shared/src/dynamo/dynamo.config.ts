import { DynamoDB } from '@aws-sdk/client-dynamodb';
import {
  BaseConfig,
  BasemapsConfigProvider,
  ConfigBundle,
  ConfigImagery,
  ConfigPrefix,
  ConfigProvider,
  ConfigTileSet,
  ConfigVectorStyle,
} from '@basemaps/config';
import { ConfiguredRetryStrategy } from '@smithy/util-retry';

import { ConfigDynamoBase } from './dynamo.config.base.js';
import { ConfigDynamoCached } from './dynamo.config.cached.js';

export class ConfigProviderDynamo extends BasemapsConfigProvider {
  Prefix = ConfigPrefix;

  dynamo: DynamoDB;
  tableName: string;
  type = 'dynamo' as const;

  Imagery = new ConfigDynamoCached<ConfigImagery>(this, ConfigPrefix.Imagery);
  Style = new ConfigDynamoCached<ConfigVectorStyle>(this, ConfigPrefix.Style);
  TileSet = new ConfigDynamoBase<ConfigTileSet>(this, ConfigPrefix.TileSet);
  Provider = new ConfigDynamoCached<ConfigProvider>(this, ConfigPrefix.Provider);
  ConfigBundle = new ConfigDynamoBase<ConfigBundle>(this, ConfigPrefix.ConfigBundle);

  constructor(tableName: string) {
    super();
    this.dynamo = new DynamoDB({
      region: 'ap-southeast-2',
      retryStrategy: new ConfiguredRetryStrategy(
        5, // max attempts.
        (attempt: number) => 100 + attempt * 250, // 100, 350, 600, 850, 1100ms
      ),
    });
    this.tableName = tableName;
  }

  record(): BaseConfig {
    const now = Date.now();
    return { id: '', name: '', updatedAt: now };
  }
}
