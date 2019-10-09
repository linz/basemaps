import { ALBEvent, ALBResult } from 'aws-lambda';
import { HttpHeader } from './header';
import { LambdaHttpResponse, ApplicationJson } from './lambda.response.http';

/**
 * ALB response that will return either a JSON object representing the error
 * or success
 */
export class LambdaHttpResponseAlb extends LambdaHttpResponse {
    public headers: Record<string, string> | null;

    public buffer(buffer: Buffer, contentType: string): void {
        this.body = buffer;
        this.header(HttpHeader.ContentType, contentType);
    }

    public header(key: string): string | null;
    public header(key: string, value: string): void;
    public header(key: string, value?: string): void | string | null {
        if (this.headers == null) {
            this.headers = {};
        }
        const headerKey = key.toLowerCase();
        if (value === undefined) {
            return this.headers[headerKey];
        }

        this.headers[headerKey] = value;
    }

    public json(object: Record<string, any>): void {
        this.body = JSON.stringify(object);
    }

    public get isBase64Encoded(): boolean {
        if (Buffer.isBuffer(this.body)) {
            return true;
        }
        return false;
    }

    public toResponse(): ALBResult {
        const isBase64Encoded = this.isBase64Encoded;
        // Force the response into application/json if the response type is not set
        if (!isBase64Encoded && this.header(HttpHeader.ContentType) == null) {
            this.header(HttpHeader.ContentType, ApplicationJson);
        }
        return {
            statusCode: this.status,
            statusDescription: this.statusDescription,
            body: this.getBody(),
            headers: this.headers || undefined,
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
