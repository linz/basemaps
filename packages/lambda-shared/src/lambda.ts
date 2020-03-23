import { Callback, Context } from 'aws-lambda';
import { Const, Env } from './const';
import { HttpHeader } from './header';
import { LambdaContext, LambdaHttpReturnType, LambdaHttpRequestType } from './lambda.context';
import { ApplicationJson, LambdaHttpResponse } from './lambda.response';
import { LogConfig } from './log';

export interface HttpStatus {
    statusCode: string;
    statusDescription: string;
}

export class LambdaFunction {
    /**
     *  Wrap a lambda function to provide extra functionality
     *
     * - Log metadata about the call on every request
     * - Catch errors and log them before exiting
     */
    public static wrap(
        fn: (req: LambdaContext) => Promise<LambdaHttpResponse>,
    ): (event: LambdaHttpRequestType, context: Context, callback: Callback<LambdaHttpReturnType>) => Promise<void> {
        return async (
            event: LambdaHttpRequestType,
            context: Context,
            callback: Callback<LambdaHttpReturnType>,
        ): Promise<void> => {
            const logger = LogConfig.get();

            // Log the lambda event for debugging
            if (process.env['DEBUG']) {
                logger.debug({ event }, 'LambdaDebug');
            }

            const ctx = new LambdaContext(event, logger);
            ctx.timer.start('lambda');

            // If a API Key exists in the headers, include it in the log output
            const apiKey = ctx.header(HttpHeader.ApiKey);
            ctx.set(Const.ApiKey.QueryString, apiKey);

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
            ctx.set('version', version);

            ctx.log.info({ lambda }, 'LambdaStart');

            let res: LambdaHttpResponse;
            try {
                res = await fn(ctx);
            } catch (error) {
                // If a LambdaHttpResponse was thrown, just reuse it as a response
                if (LambdaHttpResponse.isHttpResponse(error)) {
                    res = error;
                } else {
                    // Unhandled exception was thrown
                    ctx.set('err', error);
                    res = new LambdaHttpResponse(500, 'Internal Server Error');
                }
            }

            ctx.set('lambda', lambda);
            ctx.set('status', res.status);
            ctx.set('description', res.statusDescription);
            ctx.set('metrics', ctx.timer.metrics);

            res.header(HttpHeader.RequestId, ctx.id);
            res.header(HttpHeader.CorrelationId, ctx.correlationId);

            const duration = ctx.timer.end('lambda');
            ctx.set('unfinished', ctx.timer.unfinished);
            ctx.set('duration', duration);

            ctx.log.info(ctx.logContext, 'LambdaDone');

            if (!res.isBase64Encoded && res.header(HttpHeader.ContentType) == null) {
                res.header(HttpHeader.ContentType, ApplicationJson);
            }

            callback(null, LambdaContext.toResponse(ctx, res));
        };
    }
}
