import { lf, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { LogConfig } from '@basemaps/shared';
import { Ping, Version } from './routes/api';
import { Health } from './routes/health';
import { Tiles } from './routes/tile';
import { Router } from './router';

const app = new Router();

app.get('ping', Ping);
app.get('health', Health);
app.get('version', Version);
app.get('tiles', Tiles);

export async function handleRequest(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
    req.set('name', 'LambdaTiler');
    return await app.handle(req);
}

export const handler = lf.http(handleRequest, LogConfig.get());
