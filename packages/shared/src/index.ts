// Force aws-sdk connection reuse
process.env['AWS_NODEJS_CONNECTION_REUSE_ENABLED'] = '1';
export * from './api.js';
export { getDefaultConfig, setDefaultConfig } from './config.js';
export { Const, Env } from './const.js';
export { ConfigDynamoBase } from './dynamo/dynamo.config.base.js';
export { ConfigProviderDynamo } from './dynamo/dynamo.config.js';
export { Fsa as fsa, FsaCache, FsaChunk, FsaLog, stringToUrlFolder, urlToString } from './file.system.js';
export { getImageryCenterZoom, getPreviewQuery, getPreviewUrl, PreviewSize } from './imagery.url.js';
export { LogConfig, LogType } from './log.js';
export { LoggerFatalError } from './logger.fatal.error.js';
export { toQueryString } from './url.js';
export * from './util.js';
export { V, VNode, VNodeElement, VNodeText } from './vdom.js';
export { FsMemory } from '@chunkd/fs';
export { SourceMemory } from '@chunkd/source-memory';
export { Tiff, TiffTag } from '@cogeotiff/core';
export { Cotar } from '@cotar/core';
