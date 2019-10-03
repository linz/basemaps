/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { LambdaFunction } from '../lambda';
import { LambdaType } from '../lambda.response.http';
import { ALBResult, CloudFrontResultResponse } from 'aws-lambda';
import { HttpHeader } from '../header';
import { LambdaHttpResponseAlb } from '../lambda.response.alb';

describe('LambdaFunction', () => {
    const DoneError = new Error('Done');
    const asyncThrow = async () => {
        throw DoneError;
    };

    it('should generate a alb response on error', async () => {
        const testFunc = LambdaFunction.wrap(LambdaType.Alb, asyncThrow);

        const cb = jest.fn();
        await testFunc(null as any, null as any, cb);
        expect(cb).toBeCalledTimes(1);
        const [firstCall] = cb.mock.calls;
        const err = firstCall[0];
        const res = firstCall[1] as ALBResult;

        expect(err).toEqual(null);
        expect(res.statusCode).toEqual(500);
        expect(res.statusDescription).toEqual('Internal Server Error');
        expect(res.body).toEqual(JSON.stringify({ status: res.statusCode, message: res.statusDescription }));
        expect(res.isBase64Encoded).toEqual(false);
        expect(res.headers).not.toEqual(null);
        if (res.headers == null) return; // Typeguard to make typescript happy
        expect(res.headers[HttpHeader.CorrelationId]).not.toEqual(null);
    });

    it('should generate a cloudfront response on error', async () => {
        const testFunc = LambdaFunction.wrap(LambdaType.CloudFront, asyncThrow);

        const cb = jest.fn();
        await testFunc(null as any, null as any, cb);
        expect(cb).toBeCalledTimes(1);
        const [firstCall] = cb.mock.calls;
        const err = firstCall[0];
        const res = firstCall[1] as CloudFrontResultResponse;

        expect(err).toEqual(null);
        expect(res.status).toEqual('500');
        expect(res.statusDescription).toEqual('Internal Server Error');
        expect(res.body).toEqual(JSON.stringify({ status: 500, message: res.statusDescription }));
        expect(res.bodyEncoding).toEqual('text');
        expect(res.headers).not.toEqual(null);
        if (res.headers == null) return; // Typeguard to make typescript happy
        expect(res.headers[HttpHeader.CorrelationId]).not.toEqual(null);
    });

    it('should callback on success', async () => {
        const albOk = new LambdaHttpResponseAlb(200, 'ok');
        const testFunc = LambdaFunction.wrap(LambdaType.Alb, async () => albOk);

        const cbSpy = jest.fn();
        await testFunc(null as any, null as any, cbSpy);
        expect(cbSpy).toBeCalledTimes(1);
        expect(cbSpy).toBeCalledWith(null, albOk.toResponse());
    });
});
