import DynamoDB from 'aws-sdk/clients/dynamodb.js';
import { BasemapsConfigProvider } from '../base.config.js';
import { BaseConfig } from '../config/base.js';
import { ConfigImagery } from '../config/imagery.js';
import { ConfigJob } from '../config/job.js';
import { ConfigPrefix } from '../config/prefix.js';
import { ConfigProvider } from '../config/provider.js';
import { ConfigTileSet } from '../config/tile.set.js';
import { ConfigVectorStyle } from '../config/vector.style.js';
import { ConfigDynamoBase } from './dynamo.config.base.js';
import { ConfigDynamoCached } from './dynamo.config.cached.js';

export class ConfigProviderDynamo extends BasemapsConfigProvider {
  Prefix = ConfigPrefix;

  dynamo: DynamoDB;
  tableName: string;

  Imagery = new ConfigDynamoCached<ConfigImagery>(this, ConfigPrefix.Imagery);
  Style = new ConfigDynamoCached<ConfigVectorStyle>(this, ConfigPrefix.Style);
  TileSet = new ConfigDynamoBase<ConfigTileSet>(this, ConfigPrefix.TileSet);
  Provider = new ConfigDynamoCached<ConfigProvider>(this, ConfigPrefix.Provider);
  Job = new ConfigDynamoCached<ConfigJob>(this, ConfigPrefix.Job);

  constructor(tableName: string) {
    super();
    this.dynamo = new DynamoDB({});
    this.tableName = tableName;
  }

  record(): BaseConfig {
    const now = Date.now();
    return {
      id: '',
      name: '',
      createdAt: now,
      updatedAt: now,
    };
  }
}
