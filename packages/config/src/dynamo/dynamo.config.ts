import DynamoDB from 'aws-sdk/clients/dynamodb';
import { Epsg } from 'packages/geo/build';
import { ConfigImagery } from '../config/imagery';
import { RecordPrefix } from '../config/prefix';
import { ConfigProvider } from '../config/provider';
import { ConfigTileSet } from '../config/tile.set';
import { ConfigVectorStyle } from '../config/vector.style';
import { ConfigDynamoBase } from './dynamo.config.base';
import { ConfigDynamoVersioned } from './dynamo.config.versioned';

export type Subset<T extends U, U> = U;

const CompositeProviderKey = { name: 'main' } as const;
const CompositeTileSetKey = { name: 'string', projection: Epsg.Google };
const CompositeStyleKey = { name: 'string' };

export class ConfigDynamo {
    dynamo: DynamoDB;
    tableName: string;

    Imagery = new ConfigDynamoBase<ConfigImagery>(this, RecordPrefix.Imagery);

    Style = new ConfigDynamoVersioned<ConfigVectorStyle>(this, RecordPrefix.Style);
    TileSet = new ConfigDynamoVersioned<ConfigTileSet>(this, RecordPrefix.TileSet);
    Provider = new ConfigDynamoVersioned<ConfigProvider>(this, RecordPrefix.Provider);

    constructor(tableName: string) {
        this.dynamo = new DynamoDB({});
        this.tableName = tableName;
    }
}
