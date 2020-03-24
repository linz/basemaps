import { LambdaContext } from '../lambda.context';
import { LambdaHttpResponse } from '../lambda.response';
import { Router } from '../router';
import * as o from 'ospec';
import { LogConfig } from '../log';

/* eslint-disable @typescript-eslint/explicit-function-return-type */
o.spec('router', () => {
    function makeContext(httpMethod: string, path: string): LambdaContext {
        return new LambdaContext({ path, httpMethod } as any, LogConfig.get());
    }

    const app = new Router();

    o('should allow registration of a handler', async () => {
        app.get('test-path', async () => new LambdaHttpResponse(200, 'stub'));

        const myInfo = makeContext('get', '/v1/test-path/rest/of/path');

        const response = await app.handle(myInfo);

        o(response.status).equals(200);
        o(response.statusDescription).equals('stub');
    });

    ['delete', 'post', 'head', 'put'].forEach(method => {
        o(`should disallow "${method}"`, async () => {
            const myInfo = makeContext(method, '/v1/test-path/rest/of/path');

            const response = await app.handle(myInfo);
            o(response.status).equals(405);
            o(response.statusDescription).equals('Method not allowed');
        });
    });

    o('should allow CORS options', async () => {
        const myInfo = makeContext('options', '/v1/test-path/rest/of/path');
        const response = await app.handle(myInfo);

        o(response.status).equals(200);
        o(response.header('access-control-allow-origin')).equals('*');
        o(response.header('access-control-allow-credentials')).equals('false');
        o(response.header('access-control-allow-methods')).equals('OPTIONS,GET,PUT,POST,DELETE');
    });
});
