import { ALBEvent, ALBResult, Callback, CloudFrontRequestEvent, CloudFrontRequestResult, Context } from 'aws-lambda';
import * as pino from 'pino';
import { HttpHeader } from './header';
import { LambdaHttpResponse, LambdaType } from './lambda.response.http';
import { Logger } from './log';
import { LambdaSession } from './session';
import { LambdaHttp } from './lambda.response';
import { Const } from './const';

export interface HttpStatus {
    statusCode: string;
    statusDescription: string;
}

export type LambdaHttpRequestType = ALBEvent | CloudFrontRequestEvent;
export type LambdaHttpReturnType = ALBResult | CloudFrontRequestResult;
export class LambdaFunction {
    /**
     *  Wrap a lambda function to provide extra functionality
     *
     * - Log metadata about the call on every request
     * - Catch errors and log them before exiting
     */
    public static wrap<T extends LambdaHttpRequestType>(
        type: LambdaType,
        fn: (event: T, context: Context, logger: pino.Logger) => Promise<LambdaHttpResponse>,
        logger = Logger,
    ): (event: T, context: Context, callback: Callback<LambdaHttpReturnType>) => Promise<void> {
        return async (event: T, context: Context, callback: Callback<LambdaHttpReturnType>): Promise<void> => {
            // Extract the correlationId from the provided http headers
            const correlationId = LambdaHttp.getHeader(type, event, HttpHeader.CorrelationId);
            const session = LambdaSession.reset(correlationId);
            session.timer.start('lambda');

            // If a API Key exists in the headers, include it in the log output
            const apiKey = LambdaHttp.getHeader(type, event, HttpHeader.ApiKey);
            session.set(Const.ApiKey.QueryString, apiKey);

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

            let res: LambdaHttpResponse | undefined = undefined;
            try {
                res = await fn(event, context, log);
            } catch (error) {
                // If a LambdaHttpResponse was thrown, just reuse it as a response
                if (LambdaHttpResponse.isHttpResponse(error)) {
                    res = error;
                } else {
                    // Unhandled exception was thrown
                    session.set('err', error);
                    res = LambdaHttp.create(type, 500, 'Internal Server Error');
                }
            }

            session.set('lambda', lambda);
            session.set('status', res.status);
            session.set('description', res.statusDescription);
            session.set('metrics', session.timer.metrics);

            res.header(HttpHeader.RequestId, session.id);

            const duration = session.timer.end('lambda');
            session.set('unfinished', session.timer.unfinished);
            session.set('duration', duration);

            log.info(session.logContext, 'LambdaDone');
            // There will always be a response
            callback(null, res.toResponse());
        };
    }
}
