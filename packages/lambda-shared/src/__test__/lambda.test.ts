/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ALBResult, CloudFrontResultResponse } from 'aws-lambda';
import * as o from 'ospec';
import 'source-map-support/register';
import { HttpHeader } from '../header';
import { LambdaFunction } from '../lambda';
import { LogConfig } from '../log';
import { LambdaContext } from '../lambda.context';
import { LambdaHttpResponse } from '../lambda.response';

o.spec('LambdaFunction', () => {
    const DoneError = new Error('Done');
    const asyncThrow = async () => {
        throw DoneError;
    };

    o.beforeEach(() => {
        LogConfig.disable();
    });

    o('should generate a alb response on error', async () => {
        const testFunc = LambdaFunction.wrap(asyncThrow);

        const spy = o.spy();
        await testFunc({} as any, null as any, spy);
        o(spy.calls.length).equals(1);
        const err = spy.args[0];
        const res = spy.args[1] as ALBResult;

        o(err).equals(null);
        o(res.statusCode).equals(500);
        o(res.statusDescription).equals('Internal Server Error');
        o(res.body).equals(JSON.stringify({ status: res.statusCode, message: res.statusDescription }));
        o(res.isBase64Encoded).equals(false);
        o(res.headers).notEquals(undefined);
        if (res.headers == null) return; // Typeguard to make typescript happy

        const requestId = res.headers[HttpHeader.RequestId.toLowerCase()];
        o(typeof requestId).equals('string');
    });

    o('should generate a cloudfront response on error', async () => {
        const testFunc = LambdaFunction.wrap(asyncThrow);

        const spy = o.spy();
        await testFunc({ Records: [{ cf: { request: { headers: {} } } }] } as any, null as any, spy);
        o(spy.calls.length).equals(1);
        const err = spy.args[0];
        const res = spy.args[1] as CloudFrontResultResponse;

        o(err).equals(null);
        o(res.status).equals('500');
        o(res.statusDescription).equals('Internal Server Error');
        o(res.body).equals(JSON.stringify({ status: 500, message: res.statusDescription }));
        o(res.bodyEncoding).equals('text');
        o(res.headers).notEquals(undefined);
        if (res.headers == null) return; // Typeguard to make typescript happy

        const requestId = res.headers[HttpHeader.RequestId.toLowerCase()];
        o(Array.isArray(requestId)).equals(true);
    });

    o('should callback on success', async () => {
        const albOk = new LambdaHttpResponse(200, 'ok');
        const logs: [Record<string, any>, string][] = [];
        LogConfig.set({
            info: (a: Record<string, any>, b: string) => logs.push([a, b]),
            child: function() {
                return this;
            },
        } as any);

        const testFunc = LambdaFunction.wrap(async (ctx: LambdaContext) => {
            const { timer } = ctx;
            timer.start('xxx');
            timer.end('xxx');
            return albOk;
        });

        const spy = o.spy();
        await testFunc({} as any, null as any, spy);
        o(spy.calls.length).equals(1);
        o(spy.args[1]).deepEquals(LambdaContext.toAlbResponse(albOk));

        o(logs.length > 1).equals(true);
        const lastCall = logs[logs.length - 1];
        const json = lastCall[0];
        o(json.duration > -1).equals(true);
        o(json.metrics.xxx > -1).equals(true);
    });
});
