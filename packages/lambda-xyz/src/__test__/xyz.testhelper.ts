import { LambdaContext, LogConfig } from '@basemaps/lambda-shared';

export function mockRequest(path: string, method = 'get', headers = {}): LambdaContext {
    return new LambdaContext(
        {
            requestContext: null as any,
            httpMethod: method.toUpperCase(),
            path,
            headers,
            body: null,
            isBase64Encoded: false,
        },
        LogConfig.get(),
    );
}
