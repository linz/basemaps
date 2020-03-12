import { LambdaHttpResponseAlb, PathData, getXyzFromPath, Env } from '@basemaps/lambda-shared';

const getRegistry: any = {};

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

    const handler: any = getRegistry[path];
    if (handler !== undefined) {
        const response = handler(path);
        return response;
    }

    const pathMatch = getXyzFromPath(path);
    if (pathMatch == null) {
        return new LambdaHttpResponseAlb(404, 'Path not found');
    }

    if (isNaN(pathMatch.x) || isNaN(pathMatch.y) || isNaN(pathMatch.z)) {
        return new LambdaHttpResponseAlb(404, 'Path not found');
    }

    return pathMatch;
}

route.registerGet = (path: string, handler: (path: string) => LambdaHttpResponseAlb): void => {
    if (getRegistry[path] !== undefined) throw new Error(path + ' already registered');
    getRegistry[path] = handler;
};

route.deregisterGet = (path: string): void => {
    delete getRegistry[path];
};

const okResponse = (): LambdaHttpResponseAlb => new LambdaHttpResponseAlb(200, 'ok');

route.registerGet('/ping', okResponse);
route.registerGet('/health', okResponse);

route.registerGet('/version', () => {
    const response = new LambdaHttpResponseAlb(200, 'ok');
    response.json({ version: process.env[Env.Version], hash: process.env[Env.Hash] });
    return response;
});
