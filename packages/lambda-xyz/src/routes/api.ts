import { LambdaHttpResponse, Env } from '@basemaps/lambda-shared';

export async function Health(): Promise<LambdaHttpResponse> {
    return new LambdaHttpResponse(200, 'ok');
}

export async function Ping(): Promise<LambdaHttpResponse> {
    return new LambdaHttpResponse(200, 'ok');
}

export async function Version(): Promise<LambdaHttpResponse> {
    const response = new LambdaHttpResponse(200, 'ok');
    response.json({ version: process.env[Env.Version], hash: process.env[Env.Hash] });
    return response;
}
