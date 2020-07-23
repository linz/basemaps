import { LambdaContext } from '@basemaps/lambda';
import { LogConfig } from '@basemaps/shared';
import o from 'ospec';
import { handleRequest } from '../index';

o.spec('LambdaXyz index', () => {
    function req(path: string, method = 'get'): LambdaContext {
        return new LambdaContext(
            {
                requestContext: null as any,
                httpMethod: method.toUpperCase(),
                path,
                body: null,
                isBase64Encoded: false,
            },
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

            const response: any = await handleRequest(req('/version'));

            o(response.status).equals(200);
            o(response.statusDescription).equals('ok');
            o(JSON.parse(response.body)).deepEquals({
                version: '1.2.3',
                hash: 'abc456',
            });
        });
    });

    o('should respond to /health', async () => {
        const res = await handleRequest(req('/health'));
        o(res.status).equals(200);
        o(res.statusDescription).equals('ok');
    });

    o('should respond to /ping', async () => {
        const res = await handleRequest(req('/ping'));
        o(res.status).equals(200);
        o(res.statusDescription).equals('ok');
    });
});
