// Force aws-sdk connection reuse
process.env['AWS_NODEJS_CONNECTION_REUSE_ENABLED'] = '1';
export * from './api.js';
export { getDefaultConfig, setDefaultConfig } from './config.js';
export { Const, Env } from './const.js';
export { ConfigDynamoBase } from './dynamo/dynamo.config.base.js';
export { ConfigProviderDynamo } from './dynamo/dynamo.config.js';
export { getImageryCenterZoom, getPreviewUrl, PreviewSize } from './imagery.url.js';
export { LogConfig, LogType } from './log.js';
export { LoggerFatalError } from './logger.fatal.error.js';
export { toQueryString } from './url.js';
export * from './util.js';
export { V, VNode, VNodeElement, VNodeText } from './vdom.js';

import { Fsa } from './file.system.js';
export const fsa = Fsa;
