# @basemaps/lambda

Opinionated Lambda function wrappers

-   First class promise support
-   Every request is logged
-   Supports logging of timing data
-   Supports throwing of responses

```typescript
import { LambdaContext, LambdaFunction, LambdaHttpResponse } from '@basemaps/lambda';

export async function handleRequest(req: LambdaContext): Promise<LambdaHttpResponse> {
    req.set('logValue', 'Something to log'); // This will be logged when the function finishes

    if (req.method == 'HEAD') return new LambdaHttpResponse(405, 'Invalid method');

    // log timing information
    req.timer.start('validate');
    await ValidateRequest(req);
    req.timer.end('validate');

    // Responses can be thrown too
    if (isInvalid) throw new LambdaHttpResponse(500, 'Something went wrong');

    const response = new LambdaHttpResponse(100, 'Continue');
    // Set Http on responses
    if (doNotCache) response.header('Cache-Control', 'max-age=0');
    return response;
}

export const handler = LambdaFunction.wrap(handleRequest, logger);
```
