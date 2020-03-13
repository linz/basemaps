import { Env, LambdaHttpResponseAlb, LambdaSession, LogConfig } from '@basemaps/lambda-shared';
import { ALBEvent } from 'aws-lambda';
import * as o from 'ospec';
import 'source-map-support/register';
import { handleRequest } from '../index';

o.spec('LambdaXyz index', () => {
    function req(path: string, method = 'get'): ALBEvent {
        return {
            requestContext: null as any,
            httpMethod: method.toUpperCase(),
            path,
            body: null,
            isBase64Encoded: false,
        };
    }

    o.spec('version', () => {
        const origVersion: any = process.env[Env.Version];
        const origHash: any = process.env[Env.Hash];
        o.after(() => {
            process.env[Env.Version] = origVersion;
            process.env[Env.Hash] = origHash;
        });

        o('should return version', async () => {
            process.env[Env.Version] = '1.2.3';
            process.env[Env.Hash] = 'abc456';

            const response: any = await handleRequest(req('/version'), new LambdaSession(), LogConfig.get());

            o(LambdaHttpResponseAlb.isHttpResponse(response)).equals(true);
            o(response.status).equals(200);
            o(response.statusDescription).equals('ok');
            o(JSON.parse(response.body)).deepEquals({
                version: '1.2.3',
                hash: 'abc456',
            });
        });
    });

    o('should respond to /health', async () => {
        const res = await handleRequest(req('/health'), new LambdaSession(), LogConfig.get());
        o(res.status).equals(200);
        o(res.statusDescription).equals('ok');
    });

    o('should respond to /ping', async () => {
        const res = await handleRequest(req('/ping'), new LambdaSession(), LogConfig.get());
        o(res.status).equals(200);
        o(res.statusDescription).equals('ok');
    });
});
