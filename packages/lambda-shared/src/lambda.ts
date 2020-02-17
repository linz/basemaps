import { ALBEvent, ALBResult, Callback, CloudFrontRequestEvent, CloudFrontRequestResult, Context } from 'aws-lambda';
import { HttpHeader } from './header';
import { LambdaHttpResponse, LambdaType } from './lambda.response.http';
import { LogConfig, LogType } from './log';
import { LambdaSession } from './session';
import { LambdaHttp } from './lambda.response';
import { Const, Env } from './const';
import { ulid } from 'ulid';

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
        fn: (event: T, session: LambdaSession, logger: LogType) => Promise<LambdaHttpResponse>,
    ): (event: T, context: Context, callback: Callback<LambdaHttpReturnType>) => Promise<void> {
        return async (event: T, context: Context, callback: Callback<LambdaHttpReturnType>): Promise<void> => {
            const logger = LogConfig.get();

            // Log the lambda event for debugging
            if (process.env['DEBUG']) {
                logger.debug({ event }, 'LambdaDebug');
            }

            // Extract the correlationId from the provided http headers
            const correlationId = LambdaHttp.getHeader(type, event, HttpHeader.CorrelationId);
            const session = new LambdaSession(correlationId ?? ulid());
            session.timer.start('lambda');

            // If a API Key exists in the headers, include it in the log output
            const apiKey = LambdaHttp.getHeader(type, event, HttpHeader.ApiKey);
            session.set(Const.ApiKey.QueryString, apiKey);

            const log = logger.child({ id: session.id });

            const lambda = {
                name: process.env['AWS_LAMBDA_FUNCTION_NAME'],
                memory: process.env['AWS_LAMBDA_FUNCTION_MEMORY_SIZE'],
                version: process.env['AWS_LAMBDA_FUNCTION_VERSION'],
                region: process.env['AWS_REGION'],
            };

            const version = {
                version: Env.get(Env.Version, 'HEAD'),
                hash: Env.get(Env.Hash, 'HEAD'),
            };
            session.set('version', version);

            log.info({ lambda }, 'LambdaStart');

            let res: LambdaHttpResponse | undefined = undefined;
            try {
                res = await fn(event, session, log);
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
