import { LambdaHttpResponse, HttpHeader } from '@basemaps/lambda';

const OkResponse = new LambdaHttpResponse(200, 'ok');
OkResponse.header(HttpHeader.CacheControl, 'no-store');

export async function Health(): Promise<LambdaHttpResponse> {
    return OkResponse;
}

export async function Ping(): Promise<LambdaHttpResponse> {
    return OkResponse;
}

export async function Version(): Promise<LambdaHttpResponse> {
    const response = new LambdaHttpResponse(200, 'ok');
    response.header(HttpHeader.CacheControl, 'no-store');
    response.json({ version: process.env.GIT_VERSION, hash: process.env.GIT_HASH });
    return response;
}
