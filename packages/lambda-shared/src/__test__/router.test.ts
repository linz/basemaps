import * as o from 'ospec';
import { LambdaHttpResponseAlb } from '../lambda.response.alb';
import { LogConfig } from '../log';
import { Router, ReqInfo, ReqCallback } from '../router';
import { LambdaSession } from '../session';

/* eslint-disable @typescript-eslint/explicit-function-return-type */
o.spec('router', () => {
    const newResponse = (
        status: number,
        description: string,
        headers?: Record<string, string>,
    ): LambdaHttpResponseAlb => new LambdaHttpResponseAlb(status, description, headers);

    const app = new Router(newResponse);
    const session = new LambdaSession();
    const logger = LogConfig.get();

    class MyReqInfo extends ReqInfo {
        private _httpMethod: string;
        private _urlPath: string;
        constructor(method: string, urlPath: string) {
            super(session, logger);
            this._httpMethod = method;
            this._urlPath = urlPath;
        }
        get httpMethod(): string {
            return this._httpMethod;
        }
        get urlPath(): string {
            return this._urlPath;
        }
        getHeader(_key: string) {
            return _key ? null : '';
        }
    }

    o('should allow registration of a handler', async () => {
        const expectedRet = new LambdaHttpResponseAlb(200, 'stub');
        let expectedInfo: any;

        const stub: ReqCallback = async (info: ReqInfo): Promise<LambdaHttpResponseAlb> => {
            expectedInfo = info;
            return Promise.resolve(expectedRet);
        };

        app.get('test-path', stub);

        const myInfo = new MyReqInfo('get', '/v1/test-path/rest/of/path');

        const response: any = await app.handle(myInfo);

        o(response).equals(expectedRet);
        o(expectedInfo).equals(myInfo);
    });

    o('should allow only get and options methods', async () => {
        const myInfo = new MyReqInfo('post', '/v1/test-path/rest/of/path');

        const response: any = await app.handle(myInfo);
        o(LambdaHttpResponseAlb.isHttpResponse(response)).equals(true);
        o(response.status).equals(405);
        o(response.statusDescription).equals('Method not allowed');
    });
});
