import { LambdaSession, LogType, ReqInfo } from '@basemaps/lambda-shared';
import { CloudFrontRequest, CloudFrontRequestEvent } from 'aws-lambda';

export class ReqInfoCloudFront extends ReqInfo {
    event: CloudFrontRequestEvent;
    request: CloudFrontRequest;
    private _httpMethod: string;

    constructor(event: CloudFrontRequestEvent, session: LambdaSession, logger: LogType) {
        super(session, logger);
        const [record] = event.Records;
        this.event = event;
        this.request = record.cf.request;
        this._httpMethod = this.request.method.toLowerCase();
    }

    get httpMethod(): string {
        return this._httpMethod;
    }
    get urlPath(): string {
        return this.request.uri;
    }

    /**
     * Load a header value from CloudFront headers
     *
     * @param headers CloudFrontHeaders
     * @param key header key to load (lower case)
     */
    getHeader(key: string): string | null {
        const { headers } = this.request;
        const headerVal = headers[key];
        if (headerVal == null) {
            return null;
        }
        if (headerVal.length < 1) {
            return null;
        }
        return headerVal[0].value;
    }
}
