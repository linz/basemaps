import { LambdaHttpResponse } from '@basemaps/lambda';

export async function Health(): Promise<LambdaHttpResponse> {
    return new LambdaHttpResponse(200, 'ok');
}

export async function Ping(): Promise<LambdaHttpResponse> {
    return new LambdaHttpResponse(200, 'ok');
}

export async function Version(): Promise<LambdaHttpResponse> {
    const response = new LambdaHttpResponse(200, 'ok');
    response.json({ version: process.env.GIT_VERSION, hash: process.env.GIT_HASH });
    return response;
}
