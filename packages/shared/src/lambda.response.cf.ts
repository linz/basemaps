import { LambdaHttpResponse, ApplicationJson } from './lambda.response.http';
import { CloudFrontResultResponse, CloudFrontRequestEvent, CloudFrontRequest } from 'aws-lambda';
import { HttpHeader } from './header';

/**
 * Create a json (generally error) response for CloudFront requests
 */
export class LambdaHttpResponseCloudFront extends LambdaHttpResponse {
    public headers: Record<string, { key: string; value: string }[]> | null;

    public header(key: string): string | null;
    public header(key: string, value: string): void;
    public header(key: string, value?: string): void | null | string {
        if (this.headers == null) {
            this.headers = {};
        }
        const headerKey = key.toLowerCase();
        if (value === undefined) {
            const value = this.headers[headerKey];
            if (value == null) {
                return null;
            }
            return value[0].value;
        }
        this.headers[headerKey] = [{ key, value: String(value) }];
    }

    public toResponse(): CloudFrontResultResponse {
        if (this.header(HttpHeader.ContentType) == null) {
            this.header(HttpHeader.ContentType, ApplicationJson);
        }
        return {
            status: String(this.status),
            statusDescription: this.statusDescription,
            body: this.getBody(),
            headers: this.headers || {},
            bodyEncoding: 'text',
        };
    }
    /** Extract a header from a CloudFront request event */
    public static getHeader(req: CloudFrontRequestEvent, key: string): string | null {
        if (req.Records == null || req.Records[0] == null) {
            return null;
        }

        const headers = req.Records[0].cf.request.headers;
        if (headers == null) {
            return null;
        }

        const value = headers[key.toLowerCase()];
        if (value == null || value.length == 0) {
            return null;
        }

        return value[0].value;
    }
}

/**
 * Wraps an existing CloudFront request with some helper utilities for adding headers
 */
export class LambdaHttpResponseCloudFrontRequest extends LambdaHttpResponse {
    private req: CloudFrontRequest;
    public constructor(req: CloudFrontRequest) {
        super(200, 'ok'); // These values are ignored
        this.req = req;
    }

    public header(key: string): string | null;
    public header(key: string, value: string): void;
    public header(key: string, value?: string): void | null | string {
        const headerKey = key.toLowerCase();
        if (value === undefined) {
            const value = this.req.headers[headerKey];
            if (value == null) {
                return null;
            }
            return value[0].value;
        }

        this.req.headers[headerKey] = [{ key, value: String(value) }];
    }

    public toResponse(): CloudFrontRequest {
        return this.req;
    }
}
