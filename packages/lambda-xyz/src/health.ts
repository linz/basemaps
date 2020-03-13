import { LambdaHttpResponseAlb } from '@basemaps/lambda-shared';

export default async (): Promise<LambdaHttpResponseAlb> => new LambdaHttpResponseAlb(200, 'ok');
