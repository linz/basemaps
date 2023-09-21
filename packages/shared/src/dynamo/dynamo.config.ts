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
import DynamoDB from 'aws-sdk/clients/dynamodb.js';
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
    this.dynamo = new DynamoDB({ region: 'ap-southeast-2' });
    this.tableName = tableName;
  }

  record(): BaseConfig {
    const now = Date.now();
    return { id: '', name: '', updatedAt: now };
  }
}
