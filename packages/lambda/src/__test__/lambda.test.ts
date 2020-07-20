/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ALBResult, CloudFrontResultResponse } from 'aws-lambda';
import o from 'ospec';
import { HttpHeader } from '../header';
import { LambdaFunction } from '../lambda';
import { LambdaContext } from '../lambda.context';
import { LambdaHttpResponse } from '../lambda.response';
import { FakeLogger } from './log.spy';

o.spec('LambdaFunction', () => {
    const DoneError = new Error('Done');

    const asyncThrow = async () => {
        throw DoneError;
    };

    o('should generate a alb response on error', async () => {
        const testFunc = LambdaFunction.wrap(asyncThrow, FakeLogger());

        const spy = o.spy();
        await testFunc({ httpMethod: 'GET' } as any, null as any, spy);
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
        const testFunc = LambdaFunction.wrap(asyncThrow, FakeLogger());

        const spy = o.spy();
        await testFunc({ Records: [{ cf: { request: { method: 'GET', headers: {} } } }] } as any, null as any, spy);
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

        const fakeLogger = FakeLogger();
        const testFunc = LambdaFunction.wrap(async (ctx: LambdaContext) => {
            const { timer } = ctx;
            timer.start('xxx');
            timer.end('xxx');
            return albOk;
        }, fakeLogger);

        const spy = o.spy();
        await testFunc({ httpMethod: 'GET' } as any, null as any, spy);
        o(spy.calls.length).equals(1);
        o(spy.args[1]).deepEquals(LambdaContext.toAlbResponse(albOk));

        o(fakeLogger.spy.callCount).equals(2);
        const [lastCall] = fakeLogger.spy.args;
        o(lastCall.duration > -1).equals(true);
        o(lastCall.metrics.xxx > -1).equals(true);
    });
});
