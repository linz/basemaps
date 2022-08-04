import { LambdaHttpResponse } from '@linzjs/lambda';

export const NotFound = (): LambdaHttpResponse => new LambdaHttpResponse(404, 'Not Found');
export const NotModified = (): LambdaHttpResponse => new LambdaHttpResponse(304, 'Not modified');
export const NoContent = (): LambdaHttpResponse => new LambdaHttpResponse(204, 'No Content');
export const OkResponse = (): LambdaHttpResponse => new LambdaHttpResponse(200, 'ok');
