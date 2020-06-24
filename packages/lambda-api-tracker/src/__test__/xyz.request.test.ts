import { LogConfig } from '@basemaps/shared';
import { HttpHeader, LambdaContext, LambdaHttpResponse } from '@basemaps/lambda';
import { CloudFrontRequestResult } from 'aws-lambda';
import o from 'ospec';
import { handleRequest } from '../index';
import { ValidateRequest } from '../validate';

o.spec('xyz-request', () => {
    const origValidate = ValidateRequest.validate;

    /** Generate mock CloudFrontRequestEvent */
    function req(uri = '', querystring = '?api=12345'): LambdaContext {
        return new LambdaContext(
            {
                Records: [
                    {
                        cf: {
                            request: {
                                method: 'get',
                                querystring,
                                uri,
                                headers: {
                                    referer: [{ key: 'Referer', value: 'from/url' }],
                                    'user-agent': [{ key: 'User-Agent', value: 'test browser' }],
                                },
                                clientIp: '1.2.3.4',
                            },
                        },
                    },
                ],
            } as any,
            LogConfig.get(),
        );
    }

    o.beforeEach(() => {
        LogConfig.disable();
    });

    o.after(() => {
        ValidateRequest.validate = origValidate;
    });

    o('should export handler', async () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const base = require('../index');
        o(typeof base.handler).equals('function');
    });

    o('should catch missing api key', async () => {
        const res = await handleRequest(req('/v1/tiles/aerial/3857/1/2/3.png', ''));

        o(res.status).equals(400);
        o(res.statusDescription).equals('Invalid API Key');
    });

    o('should return LambdaHttpResponseCloudFrontRequest on success', async () => {
        ValidateRequest.validate = async (): Promise<LambdaHttpResponse | null> => null;

        const request = req('/v1/tiles/aerial/3857/1/2/3.png');
        const res = await handleRequest(request);

        o(res.status).equals(100);
        const response = LambdaContext.toResponse(request, res) as CloudFrontRequestResult;

        const corrId = String(res.header(HttpHeader.CorrelationId));
        o(response?.headers).deepEquals({
            referer: [{ key: 'Referer', value: 'from/url' }],
            'user-agent': [{ key: 'User-Agent', value: 'test browser' }],
            'x-linz-correlation-id': [
                {
                    key: 'x-linz-correlation-id',
                    value: corrId,
                },
            ],
            'x-linz-api-key': [{ key: 'x-linz-api-key', value: '12345' }],
            'x-linz-request-id': [{ key: 'x-linz-request-id', value: String(res.header(HttpHeader.RequestId)) }],
        });
    });

    o('should not cache WMTSCapabilities', async () => {
        ValidateRequest.validate = async (): Promise<LambdaHttpResponse | null> => null;

        const request = req('/v1/tiles/aerial/3857/WMTSCapabilities.xml');
        const res = await handleRequest(request);

        o(res.status).equals(100);
        const response = LambdaContext.toResponse(request, res) as CloudFrontRequestResult;

        const corrId = String(res.header(HttpHeader.CorrelationId));
        o(response?.headers).deepEquals({
            referer: [{ key: 'Referer', value: 'from/url' }],
            'user-agent': [{ key: 'User-Agent', value: 'test browser' }],
            'cache-control': [
                {
                    key: 'cache-control',
                    value: 'max-age=0',
                },
            ],
            'x-linz-correlation-id': [
                {
                    key: 'x-linz-correlation-id',
                    value: corrId,
                },
            ],
            'x-linz-api-key': [{ key: 'x-linz-api-key', value: '12345' }],
            'x-linz-request-id': [{ key: 'x-linz-request-id', value: String(res.header(HttpHeader.RequestId)) }],
        });
    });
});
