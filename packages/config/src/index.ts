import { ConfigInstance } from './base.config';

export { BasemapsConfigProvider } from './base.config';
export { BaseConfig } from './config/base';
export { ConfigImagery } from './config/imagery';
export { ConfigProvider } from './config/provider';
export {
    ConfigLayer,
    ConfigTileSet,
    ConfigTileSetRaster,
    ConfigTileSetVector,
    TileResizeKernel,
    TileSetType,
} from './config/tile.set';
export { ConfigVectorStyle, Sources, StyleJson } from './config/vector.style';
export { ConfigProviderDynamo } from './dynamo/dynamo.config';
export { ConfigDynamoBase } from './dynamo/dynamo.config.base';
export { ConfigProviderMemory } from './memory/memory.config';
export { TileSetNameComponents, TileSetNameParser } from './tile.set.name';

export const Config = new ConfigInstance();
