import { LambdaFunction, Logger } from '@basemaps/shared';
import { ALBEvent, ALBResult, Context } from 'aws-lambda';
import { getXyzFromPath } from './path';

function makeResponse(statusCode: number, message: string, headers?: { [key: string]: string }): ALBResult {
    if (headers == null) {
        headers = {};
    }
    headers['content-type'] = 'application/json';
    return {
        statusCode,
        statusDescription: message,
        body: JSON.stringify({ status: statusCode, message }),
        headers,
        isBase64Encoded: false,
    };
}

export async function handleRequest(event: ALBEvent, context: Context, logger: typeof Logger): Promise<ALBResult> {
    const httpMethod = event.httpMethod.toLowerCase();

    // Allow cross origin requests
    if (httpMethod === 'options') {
        return makeResponse(200, 'Options', {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'false',
            'Access-Control-Allow-Methods': 'OPTIONS,GET,PUT,POST,DELETE',
        });
    }

    if (httpMethod !== 'get') {
        return makeResponse(405, 'Method not allowed');
    }

    const pathMatch = getXyzFromPath(event.path);
    if (pathMatch == null) {
        return makeResponse(404, 'Path not found');
    }

    // TODO get tile and serve it

    return {
        statusCode: 200,
        statusDescription: 'ok',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ hello: 'world', pathMatch }),
        isBase64Encoded: false,
    };
}

export const handler = LambdaFunction.wrap<ALBEvent, ALBResult>(handleRequest);
