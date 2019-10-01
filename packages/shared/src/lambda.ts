import { ALBResult, Callback, CloudFrontRequestResult, Context } from 'aws-lambda';
import * as pino from 'pino';
import { Logger } from './log';
import { LambdaSession } from './session';

export interface HttpStatus {
    statusCode: string;
    statusDescription: string;
}
export function hasStatus(x: any): x is HttpStatus {
    return x != null && x['statusCode'] != null;
}
export type LambdaHttpReturnType = ALBResult | CloudFrontRequestResult;
export class LambdaFunction {
    /**
     *  Wrap a lambda function to provide extra functionality
     *
     * - Log metadata about the call on every request
     * - Catch errors and log them before exiting
     */
    public static wrap<T, K extends LambdaHttpReturnType>(
        fn: (event: T, context: Context, logger: pino.Logger) => Promise<K>,
        logger = Logger,
    ): (event: T, context: Context, callback: Callback<K>) => Promise<void> {
        return async (event: T, context: Context, callback: Callback<K>): Promise<void> => {
            const session = LambdaSession.reset();
            session.timer.start('lambda');

            // TODO pull a correlationId from `x-linz-correlation-id` header
            // const correlationId = (session.correlationId = ulid.ulid());
            const log = logger.child({ id: session.id });

            const lambda = {
                name: process.env['AWS_LAMBDA_FUNCTION_NAME'],
                memory: process.env['AWS_LAMBDA_FUNCTION_MEMORY_SIZE'],
                version: process.env['AWS_LAMBDA_FUNCTION_VERSION'],
                region: process.env['AWS_REGION'],
            };

            log.info({ lambda }, 'LambdaStart');
            session.set('lambda', lambda);
            session.set('status', 200);
            session.set('statusDescription', 'ok');

            let res: K | undefined = undefined;
            let err: Error | undefined = undefined;

            try {
                res = await fn(event, context, log);
                if (hasStatus(res)) {
                    session.set('status', parseInt(res.statusCode, 10));
                    session.set('statusDescription', res.statusDescription);
                }
            } catch (error) {
                session.set('status', 500);
                session.set('error', error);
                err = error;
            }

            session.set('duration', session.timer.end('lambda'));
            session.set('metrics', session.timer.metrics);
            session.set('unfinished', session.timer.unfinished);

            log.info(session.logContext, 'LambdaDone');
            callback(err, res);
        };
    }
}
