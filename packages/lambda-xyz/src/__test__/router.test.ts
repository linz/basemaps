import * as o from 'ospec';
import { LambdaHttpResponseAlb, Env } from '@basemaps/lambda-shared';
import { route } from '../router';

/* eslint-disable @typescript-eslint/explicit-function-return-type */
o.spec('router', () => {
    o('should allow only get and options methods', () => {
        const response: any = route('post', '/');
        o(LambdaHttpResponseAlb.isHttpResponse(response)).equals(true);
        o(response.status).equals(405);
        o(response.statusDescription).equals('Method not allowed');
    });

    o('should allow options request', () => {
        const response: any = route('options', '/');
        o(LambdaHttpResponseAlb.isHttpResponse(response)).equals(true);
        o(response.status).equals(200);
        o(response.statusDescription).equals('Options');
        o(response.headers).deepEquals({
            'access-control-allow-origin': '*',
            'access-control-allow-credentials': 'false',
            'access-control-allow-methods': 'OPTIONS,GET,PUT,POST,DELETE',
        });
    });

    o('should get ping', () => {
        const response: any = route('get', '/ping');
        o(LambdaHttpResponseAlb.isHttpResponse(response)).equals(true);
        o(response.status).equals(200);
        o(response.statusDescription).equals('ok');
    });

    o('should get health', () => {
        const response: any = route('get', '/health');
        o(LambdaHttpResponseAlb.isHttpResponse(response)).equals(true);
        o(response.status).equals(200);
        o(response.statusDescription).equals('ok');
    });


    o('should get version', () => {
        const origVersion: any = process.env[Env.Version];
        const origHash: any = process.env[Env.Hash];
        o.after(() => {
            process.env[Env.Version] = origVersion;
            process.env[Env.Hash] = origHash;
        });
        process.env[Env.Version] = '1.2.3';
        process.env[Env.Hash] = 'abc456';

        o('should return version', () => {
            process.env[Env.Version] = '1.2.3';
            process.env[Env.Hash] = 'abc456';

            const response: any = route('get', '/version');
            o(LambdaHttpResponseAlb.isHttpResponse(response)).equals(true);
            o(response.status).equals(200);
            o(response.statusDescription).equals('ok');
            o(JSON.parse(response.body)).deepEquals({
                version: '1.2.3',
                hash: 'abc456',
            });
        });
    });
});
