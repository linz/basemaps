import { LambdaHttpResponse } from '@linzjs/lambda';

export const NotFound = (): LambdaHttpResponse => new LambdaHttpResponse(404, 'Not Found');
export const NotModified = (): LambdaHttpResponse => new LambdaHttpResponse(304, 'Not modified');
