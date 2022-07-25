import { LambdaHttpResponse } from '@linzjs/lambda';

export const NotFound = new LambdaHttpResponse(404, 'Not Found');
export const NotModified = new LambdaHttpResponse(304, 'Not modified');
