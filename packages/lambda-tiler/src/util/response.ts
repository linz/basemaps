import { LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';

export const NotFound = (message?: string): LambdaHttpResponse => {
  return new LambdaHttpResponse(404, message ? 'Not Found: ' + message : 'Not Found');
};
export const NotModified = (): LambdaHttpResponse => new LambdaHttpResponse(304, 'Not modified');
export const NoContent = (): LambdaHttpResponse => new LambdaHttpResponse(204, 'No Content');
export const OkResponse = (req: LambdaHttpRequest): LambdaHttpResponse => {
  return new LambdaHttpResponse(200, 'ok').json({ id: req.id, correlationId: req.correlationId, message: 'ok' });
};
