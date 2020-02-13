/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { LambdaHttp } from '../lambda.response';
import { LambdaHttpResponseAlb } from '../lambda.response.alb';
import { LambdaHttpResponseCloudFront } from '../lambda.response.cf';
import { LambdaType } from '../lambda.response.http';

describe('LambdaResponse', () => {
    it('should create a cloudfront response', () => {
        const res = new LambdaHttpResponseCloudFront(200, 'ok');
        expect(res.toResponse()).toEqual({
            status: '200',
            statusDescription: 'ok',
            headers: { 'content-type': [{ key: 'Content-Type', value: 'application/json' }] },
            body: JSON.stringify({ status: 200, message: 'ok' }),
            bodyEncoding: 'text',
        });
    });

    it('should create a cloudfront response [using LambdaHttp.create]', () => {
        const res = LambdaHttp.create(LambdaType.CloudFront, 200, 'ok');
        expect(res.toResponse()).toEqual({
            status: '200',
            statusDescription: 'ok',
            headers: { 'content-type': [{ key: 'Content-Type', value: 'application/json' }] },
            body: JSON.stringify({ status: 200, message: 'ok' }),
            bodyEncoding: 'text',
        });
    });

    it('should create a alb response', () => {
        const res = new LambdaHttpResponseAlb(200, 'ok');

        expect(res.toResponse()).toEqual({
            statusCode: 200,
            statusDescription: 'ok',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ status: 200, message: 'ok' }),
            isBase64Encoded: false,
        });
    });

    it('should create a alb response [using LambdaHttp.create]', () => {
        const res = LambdaHttp.create(LambdaType.Alb, 200, 'ok');

        expect(res.toResponse()).toEqual({
            statusCode: 200,
            statusDescription: 'ok',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ status: 200, message: 'ok' }),
            isBase64Encoded: false,
        });
    });

    it('should create a json alb response', () => {
        const res = new LambdaHttpResponseAlb(200, 'ok');
        res.json({ foo: 'bar' });

        expect(res.toResponse()).toEqual({
            statusCode: 200,
            statusDescription: 'ok',
            body: JSON.stringify({ foo: 'bar' }),
            headers: { 'content-type': 'application/json' },
            isBase64Encoded: false,
        });
    });

    it('should create a binary alb response', () => {
        const res = new LambdaHttpResponseAlb(200, 'ok');
        const buff = Buffer.from([123]);
        res.buffer(buff, 'image/png');

        expect(res.toResponse()).toEqual({
            statusCode: 200,
            statusDescription: 'ok',
            body: buff.toString('base64'),
            headers: { 'content-type': 'image/png' },
            isBase64Encoded: true,
        });
    });
});
