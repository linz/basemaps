import DynamoDB from 'aws-sdk/clients/dynamodb';
import { BasemapsConfigProvider } from '../base.config';
import { BaseConfig } from '../config/base';
import { ConfigImagery } from '../config/imagery';
import { ConfigPrefix } from '../config/prefix';
import { ConfigProvider } from '../config/provider';
import { ConfigTileSet } from '../config/tile.set';
import { ConfigVectorStyle } from '../config/vector.style';
import { ConfigDynamoBase } from './dynamo.config.base';
import { ConfigDynamoCached } from './dynamo.config.cached';

export class ConfigProviderDynamo extends BasemapsConfigProvider {
    Prefix = ConfigPrefix;

    dynamo: DynamoDB;
    tableName: string;

    Imagery = new ConfigDynamoCached<ConfigImagery>(this, ConfigPrefix.Imagery);
    Style = new ConfigDynamoCached<ConfigVectorStyle>(this, ConfigPrefix.Style);
    TileSet = new ConfigDynamoBase<ConfigTileSet>(this, ConfigPrefix.TileSet);
    Provider = new ConfigDynamoCached<ConfigProvider>(this, ConfigPrefix.Provider);

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
