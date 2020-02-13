import { LambdaHttpResponseAlb, PathData, getXyzFromPath, Env } from '@basemaps/lambda-shared';

export function route(httpMethod: string, path: string): PathData | LambdaHttpResponseAlb {
    // Allow cross origin requests
    if (httpMethod === 'options') {
        return new LambdaHttpResponseAlb(200, 'Options', {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'false',
            'Access-Control-Allow-Methods': 'OPTIONS,GET,PUT,POST,DELETE',
        });
    }

    if (httpMethod !== 'get') {
        return new LambdaHttpResponseAlb(405, 'Method not allowed');
    }

    // TODO this is getting slightly messy, maybe we should move it into a
    // full express application so we can `app.get('/ping', () => ok);`
    if (path === '/ping') {
        return new LambdaHttpResponseAlb(200, 'ok');
    }

    if (path === '/health') {
        return new LambdaHttpResponseAlb(200, 'ok');
    }

    if (path === '/version') {
        const response = new LambdaHttpResponseAlb(200, 'ok');
        response.json({ version: process.env[Env.Version], hash: process.env[Env.Hash] });
        return response;
    }

    const pathMatch = getXyzFromPath(path);
    if (pathMatch == null) {
        return new LambdaHttpResponseAlb(404, 'Path not found');
    }

    return pathMatch;
}
