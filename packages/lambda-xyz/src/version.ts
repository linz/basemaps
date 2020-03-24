import { LambdaHttpResponseAlb, Env } from '@basemaps/lambda-shared';

export default async (): Promise<LambdaHttpResponseAlb> => {
    const response = new LambdaHttpResponseAlb(200, 'ok');
    response.json({ version: process.env[Env.Version], hash: process.env[Env.Hash] });
    return response;
};
