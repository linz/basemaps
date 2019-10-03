import { LambdaHttpResponse } from './lambda.response.http';

import { ALBResult, ALBEvent } from 'aws-lambda';
import { HttpHeader } from './header';

/**
 * ALB response that will return either a JSON object representing the error
 * or
 */
export class LambdaHttpResponseAlb extends LambdaHttpResponse {
    public headers: Record<string, string | number | boolean> = {};

    public buffer(buffer: Buffer, contentType: string): void {
        this.body = buffer;
        this.header(HttpHeader.ContentType, contentType);
    }

    public header(key: string, value: string | number | boolean): void {
        this.headers[key.toLowerCase()] = value;
    }

    public get isBase64Encoded(): boolean {
        if (Buffer.isBuffer(this.body)) {
            return true;
        }
        return false;
    }

    public toResponse(): ALBResult {
        const isBase64Encoded = this.isBase64Encoded;
        const headers = this.headers;
        // Force the response into application/json if the resposne type is not set
        if (!isBase64Encoded && headers[HttpHeader.ContentType]) {
            headers[HttpHeader.ContentType] = 'application/json';
        }
        return {
            statusCode: this.status,
            statusDescription: this.statusDescription,
            body: this.getBody(),
            headers,
            isBase64Encoded,
        };
    }

    /** Extract a header from a ALB request event */
    public static getHeader(req: ALBEvent, header: string): string | null {
        if (req.headers == null) {
            return null;
        }
        return req.headers[header];
    }
}
