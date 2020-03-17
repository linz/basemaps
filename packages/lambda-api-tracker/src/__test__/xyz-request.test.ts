import { LambdaHttpResponseCloudFront, LambdaSession, LogConfig, LogType } from '@basemaps/lambda-shared';
import { CloudFrontRequestEvent } from 'aws-lambda';
import * as o from 'ospec';
import { handleRequest } from '../index';
import { ValidateRequest } from '../validate';

o.spec('xyz-request', () => {
    const origValidate = ValidateRequest.validate;
    let mockLogger: LogType;

    /** Generate mock CloudFrontRequestEvent */
    function req(uri = '', querystring = '?api=12345'): CloudFrontRequestEvent {
        return {
            Records: [
                {
                    cf: {
                        request: {
                            method: 'get',
                            querystring,
                            uri,
                            headers: {
                                referer: ['from/url'],
                                'user-agent': ['test browser'],
                            },
                            clientIp: '1.2.3.4',
                        },
                    },
                },
            ],
        } as any;
    }

    o.beforeEach(() => {
        mockLogger = LogConfig.get();
        LogConfig.disable();
    });

    o.after(() => {
        ValidateRequest.validate = origValidate;
    });

    o('should catch invalid URLS', async () => {
        const session = new LambdaSession();
        const res = await handleRequest(req('/v1/foo'), session, mockLogger);

        o(res.status).equals(404);
    });

    o('should catch missing api key', async () => {
        const session = new LambdaSession();
        const res = await handleRequest(req('/v1/tiles/1/2/3.png', ''), session, mockLogger);

        o(res.status).equals(400);
        o(res.statusDescription).equals('Invalid API Key');
    });

    o('should return LambdaHttpResponseCloudFrontRequest on success', async () => {
        ValidateRequest.validate = async (): Promise<LambdaHttpResponseCloudFront | null> => null;

        const session = new LambdaSession();
        const res = (await handleRequest(req('/v1/tiles/1/2/3.png'), session, mockLogger)) as any;

        o(res.status).equals(200);
        const corrId = res.req.headers['x-linz-correlation-id'][0].value;
        o(res.req.headers).deepEquals({
            referer: ['from/url'],
            'user-agent': ['test browser'],
            'x-linz-correlation-id': [
                {
                    key: 'X-LINZ-Correlation-Id',
                    value: corrId,
                },
            ],
            'x-linz-api-key': [{ key: 'X-LINZ-Api-Key', value: '12345' }],
        });
    });
});
