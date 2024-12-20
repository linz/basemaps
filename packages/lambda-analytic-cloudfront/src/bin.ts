import { LogConfig } from '@basemaps/shared';
import { LambdaRequest } from '@linzjs/lambda';
import { Context } from 'aws-lambda';

import { main } from './handler.js';

/**
 * Manually run the lambda function, this can be helpful for debugging the analytic roll up process
 */
main(new LambdaRequest(null, {} as Context, LogConfig.get())).catch((e) => console.error(e));
