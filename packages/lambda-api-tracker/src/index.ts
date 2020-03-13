import {
    LambdaHttpResponse,
    LambdaHttpResponseCloudFront,
    LambdaSession,
    LogType,
    Router,
} from '@basemaps/lambda-shared';
import { CloudFrontRequestEvent } from 'aws-lambda';
import { ReqInfoCloudFront } from './req-info-cloudfront';
import tile from './tile-request';

const app = new Router(
    (status: number, description: string, headers?: Record<string, string>): LambdaHttpResponseCloudFront =>
        new LambdaHttpResponseCloudFront(status, description, headers),
);

app.get('tiles', tile);

/**
 * Validate a CloudFront request has a valid API key and is not abusing the system
 */
export async function handleRequest(
    event: CloudFrontRequestEvent,
    session: LambdaSession,
    logger: LogType,
): Promise<LambdaHttpResponse> {
    const info = new ReqInfoCloudFront(event, session, logger);

    session.set('name', 'LambdaApiTracker');
    session.set('method', info.httpMethod);
    session.set('path', info.urlPath);

    // Extract request information
    session.set('clientIp', info.request.clientIp);
    session.set('referer', info.getHeader('referer'));
    session.set('userAgent', info.getHeader('user-agent'));

    return await app.handle(info);
}
