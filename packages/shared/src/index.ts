// Force aws-sdk connection reuse
process.env['AWS_NODEJS_CONNECTION_REUSE_ENABLED'] = '1';
export { Const, Env } from './const.js';
export { LogConfig, LogType } from './log.js';
export * from './api.js';
export { V, VNode, VNodeElement, VNodeText } from './vdom.js';
export { LoggerFatalError } from './logger.fatal.error.js';
export { setDefaultConfig, getDefaultConfig } from './config.js';
export { toQueryString } from './url.js';
export { CompositeError } from './composite.error.js';
export { ConfigProviderDynamo } from './dynamo/dynamo.config.js';
export { ConfigDynamoBase } from './dynamo/dynamo.config.base.js';
export { CogJobJson, CogBuilderMetadata, CogJob, FeatureCollectionWithCrs, SourceMetadata } from './cog/types.js';
export { AlignedLevel, CoveringFraction } from './cog/constants.js';

export * from './file/index.js';
export * from './util.js';
