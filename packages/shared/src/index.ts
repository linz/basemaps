// AWS needs to be exported first to make sure the AWS is configured before anything tries to use it
export { Aws, Config } from './aws/index';
// --
export { Const, Env } from './const';
export { ApiKeyTable, ApiKeyTableRecord } from './aws/api.key.table';
export { LogConfig, LogType } from './log';
export * from './api.path';
export * from './api';
export { V, VNode, VNodeElement, VNodeText } from './vdom';
export { VNodeParser } from './vdom.parse';
export { CompositeError } from './composite.error';
export { LoggerFatalError } from './logger.fatal.error';
export { TileSetName, TileSetNameValues } from './proj/tile.set.name';

export { NamedBounds } from '@basemaps/config'; // FIXME
export * from './proj/projection';

export * from './file';

export * from './util';
