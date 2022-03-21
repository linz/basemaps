// Force aws-sdk connection reuse
process.env['AWS_NODEJS_CONNECTION_REUSE_ENABLED'] = '1';

import { Config, ConfigProviderDynamo } from '@basemaps/config';
import { Const } from './const.js';

Config.setConfigProvider(new ConfigProviderDynamo(Const.TileMetadata.TableName));

export { Config } from '@basemaps/config';
export { Const, Env } from './const.js';
export { LogConfig, LogType } from './log.js';
export * from './api.path.js';
export * from './api.js';
export { V, VNode, VNodeElement, VNodeText } from './vdom.js';
export { VNodeParser } from './vdom.parse.js';
export { CompositeError } from './composite.error.js';
export { LoggerFatalError } from './logger.fatal.error.js';
export { TileSetName, TileSetNameValues } from './proj/tile.set.name.js';

export * from './proj/projection.js';

export * from './file/index.js';

export * from './util.js';
