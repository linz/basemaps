import { LambdaContext, LambdaFunction, LambdaHttpResponse, Router } from '@basemaps/lambda';
import { LogConfig } from '@basemaps/shared';
import { Ping, Version } from './routes/api';
import { Health } from './routes/health';
import { Tiles } from './routes/tile';

const app = new Router();

app.get('ping', Ping);
app.get('health', Health);
app.get('version', Version);
app.get('tiles', Tiles);

export async function handleRequest(req: LambdaContext): Promise<LambdaHttpResponse> {
    req.set('name', 'LambdaTiler');
    return await app.handle(req);
}

export const handler = LambdaFunction.wrap(handleRequest, LogConfig.get());
