import { HttpHeader, ApplicationJson } from './header';

export class LambdaHttpResponse {
    static isHttpResponse(t: unknown): t is LambdaHttpResponse {
        return t instanceof LambdaHttpResponse;
    }

    /**
     * Http status code
     */
    public status: number;
    /**
     * Text description for the status code
     */
    public statusDescription: string;
    /**
     * Raw body object
     */
    body: string | Buffer | null = null;

    headers: Map<string, string | number | boolean> = new Map();

    public constructor(status: number, description: string, headers?: Record<string, string>) {
        this.status = status;
        this.statusDescription = description;
        if (headers != null) {
            for (const key of Object.keys(headers)) {
                const value = headers[key];
                this.header(key, value);
            }
        }
    }

    header(key: string): string | number | boolean | undefined;
    header(key: string, value: string | number | boolean): void;
    header(key: string, value?: string | number | boolean): string | number | boolean | undefined | void {
        if (value == null) {
            return this.headers.get(key.toLowerCase());
        }
        this.headers.set(key.toLowerCase(), value);
    }

    public get isBase64Encoded(): boolean {
        if (Buffer.isBuffer(this.body)) {
            return true;
        }
        return false;
    }

    json(obj: Record<string, any>): void {
        this.buffer(JSON.stringify(obj), ApplicationJson);
    }

    buffer(buf: Buffer | string, contentType = ApplicationJson): void {
        this.header(HttpHeader.ContentType, contentType);
        this.body = buf;
    }

    getBody(): string {
        if (this.body == null) {
            this.header(HttpHeader.ContentType, ApplicationJson);
            return JSON.stringify({ status: this.status, message: this.statusDescription });
        }
        if (Buffer.isBuffer(this.body)) {
            return this.body.toString('base64');
        }
        return this.body;
    }
}
