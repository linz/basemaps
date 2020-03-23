/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as o from 'ospec';
import 'source-map-support/register';
import { LambdaHttpResponse } from '../lambda.response';
import { LambdaContext } from '../lambda.context';

o.spec('LambdaResponse', () => {
    o('should create a cloudfront response', () => {
        const res = new LambdaHttpResponse(200, 'ok');
        o(LambdaContext.toCloudFrontResponse(res)).deepEquals({
            status: '200',
            statusDescription: 'ok',
            headers: { 'content-type': [{ key: 'content-type', value: 'application/json' }] },
            body: JSON.stringify({ status: 200, message: 'ok' }),
            bodyEncoding: 'text',
        });
    });

    o('should create a cloudfront response [using LambdaHttp.create]', () => {
        const res = new LambdaHttpResponse(200, 'ok');
        o(LambdaContext.toCloudFrontResponse(res)).deepEquals({
            status: '200',
            statusDescription: 'ok',
            headers: { 'content-type': [{ key: 'content-type', value: 'application/json' }] },
            body: JSON.stringify({ status: 200, message: 'ok' }),
            bodyEncoding: 'text',
        });
    });

    o('should create a alb response', () => {
        const res = new LambdaHttpResponse(200, 'ok');

        o(LambdaContext.toAlbResponse(res)).deepEquals({
            statusCode: 200,
            statusDescription: 'ok',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ status: 200, message: 'ok' }),
            isBase64Encoded: false,
        });
    });

    o('should create a json alb response', () => {
        const res = new LambdaHttpResponse(200, 'ok');
        res.json({ foo: 'bar' });

        o(LambdaContext.toAlbResponse(res)).deepEquals({
            statusCode: 200,
            statusDescription: 'ok',
            body: JSON.stringify({ foo: 'bar' }),
            headers: { 'content-type': 'application/json' },
            isBase64Encoded: false,
        });
    });

    o('should create a binary alb response', () => {
        const res = new LambdaHttpResponse(200, 'ok');
        const buff = Buffer.from([123]);
        res.buffer(buff, 'image/png');

        o(LambdaContext.toAlbResponse(res)).deepEquals({
            statusCode: 200,
            statusDescription: 'ok',
            body: buff.toString('base64'),
            headers: { 'content-type': 'image/png' },
            isBase64Encoded: true,
        });
    });
});
