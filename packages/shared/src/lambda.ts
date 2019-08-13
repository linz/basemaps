import { Logger } from './log';
import { Context, Callback } from 'aws-lambda';
import * as pino from 'pino';

export class LambdaFunction {
    /**
     *  Wrap a lambda function to provide extra functionality
     *
     * - Log metadata about the call on every request
     * - Catch errors and log them before exiting
     */
    static wrap<T, K>(fn: (event: T, context: Context, logger: pino.Logger) => Promise<K>, logger = Logger) {
        return async (event: T, context: Context, callback: Callback<K>) => {
            const startTime = Date.now();

            const lambda = {
                name: process.env['AWS_LAMBDA_FUNCTION_NAME'],
                memory: process.env['AWS_LAMBDA_FUNCTION_MEMORY_SIZE'],
                version: process.env['AWS_LAMBDA_FUNCTION_VERSION'],
                region: process.env['AWS_REGION'],
            };

            logger.info({ lambda }, 'LambdaStart');

            try {
                const res = await fn(event, context, logger);
                logger.info({ lambda, duration: Date.now() - startTime, status: 200 }, 'LambdaDone');
                callback(null, res);
            } catch (error) {
                logger.info({ lambda, duration: Date.now() - startTime, status: 500, error: error }, 'LambdaError');
                callback(error);
            }
        };
    }
}
