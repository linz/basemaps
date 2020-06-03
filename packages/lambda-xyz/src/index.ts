import { LambdaContext, LambdaFunction, LambdaHttpResponse, Router } from '@basemaps/lambda';
import { Health, Ping, Version } from './routes/api';
import { TileOrWmts } from './routes/tile';
import { LogConfig } from '@basemaps/shared';

const app = new Router();

app.get('ping', Ping);
app.get('health', Health);
app.get('version', Version);
app.get('tiles', TileOrWmts);

export async function handleRequest(req: LambdaContext): Promise<LambdaHttpResponse> {
    req.set('name', 'LambdaXyzTiler');
    req.set('method', req.method);
    req.set('path', req.path);

    return await app.handle(req);
}

export const handler = LambdaFunction.wrap(handleRequest, LogConfig.get());
