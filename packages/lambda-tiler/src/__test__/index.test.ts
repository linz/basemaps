import { LogConfig } from '@basemaps/shared';
import { LambdaAlbRequest, LambdaHttpRequest } from '@linzjs/lambda';
import { Context } from 'aws-lambda';
import o from 'ospec';
import { handleRequest } from '../index';

o.spec('LambdaXyz index', () => {
    function req(path: string, method = 'get'): LambdaHttpRequest {
        return new LambdaAlbRequest(
            {
                requestContext: null as any,
                httpMethod: method.toUpperCase(),
                path,
                body: null,
                isBase64Encoded: false,
            },
            {} as Context,
            LogConfig.get(),
        );
    }

    o('should export handler', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const foo = require('../index');
        o(typeof foo.handler).equals('function');
    });

    o.spec('version', () => {
        const origVersion: any = process.env.GIT_VERSION;
        const origHash: any = process.env.GIT_HASH;
        o.after(() => {
            process.env.GIT_VERSION = origVersion;
            process.env.GIT_HASH = origHash;
        });

        o('should return version', async () => {
            process.env.GIT_VERSION = '1.2.3';
            process.env.GIT_HASH = 'abc456';

            const response = await handleRequest(req('/version'));

            o(response.status).equals(200);
            o(response.statusDescription).equals('ok');
            o(response.header('cache-control')).equals('no-store');
            o(JSON.parse(response.body as string)).deepEquals({
                version: '1.2.3',
                hash: 'abc456',
            });
        });
    });

    o('should respond to /ping', async () => {
        const res = await handleRequest(req('/ping'));
        o(res.status).equals(200);
        o(res.statusDescription).equals('ok');
        o(res.header('cache-control')).equals('no-store');
    });
});
