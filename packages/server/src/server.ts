import { HttpHeader, HttpHeaderRequestId, LambdaAlbRequest } from '@linzjs/lambda';
import { handleRequest } from '@basemaps/lambda-tiler';
import * as ulid from 'ulid';
import express from 'express';
import { LogConfig } from '@basemaps/shared';

export const BasemapsServer = express();

BasemapsServer.get('/v1/*', async (req: express.Request, res: express.Response) => {
    const startTime = Date.now();
    const requestId = ulid.ulid();
    const logger = LogConfig.get().child({ id: requestId });
    const ctx = new LambdaAlbRequest(
        {
            httpMethod: 'get',
            path: req.path,
            queryStringParameters: req.query,
        } as any,
        logger,
    );

    if (ctx.header(HttpHeaderRequestId.RequestId) == null) {
        ctx.headers.set(HttpHeaderRequestId.RequestId, 'c' + requestId);
    }
    const ifNoneMatch = req.header(HttpHeader.IfNoneMatch);
    if (ifNoneMatch != null && !Array.isArray(ifNoneMatch)) {
        ctx.headers.set(HttpHeader.IfNoneMatch.toLowerCase(), ifNoneMatch);
    }

    try {
        const data = await handleRequest(ctx);
        res.status(data.status);
        if (data.headers) {
            for (const [header, value] of data.headers) {
                res.header(header, String(value));
            }
        }
        if (data.status < 299 && data.status > 199) res.end(data.body);
        else res.end();

        const duration = Date.now() - startTime;
        logger.info({ ...ctx.logContext, metrics: ctx.timer.metrics, status: data.status, duration }, 'Request:Done');
    } catch (e) {
        logger.fatal({ ...ctx.logContext, err: e }, 'Request:Failed');
        res.status(500);
        res.end();
    }
});
