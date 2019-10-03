import { ALBResult, CloudFrontRequestResult } from 'aws-lambda';

/**
 * As lambdas return different types we now need to define what "Type" of lambda they are
 */
export enum LambdaType {
    Alb,
    CloudFront,
}

/**
 * Generic Lambda response, all lambda's should return one of these.
 */
export abstract class LambdaHttpResponse {
    /**
     * Determine if this object is a LambdaHttpResponse
     * @param x
     */
    public static isHttpResponse(x: any): x is LambdaHttpResponse {
        return x != null && x instanceof LambdaHttpResponse;
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
    protected body: string | Buffer | null = null;

    public constructor(status: number, description: string, headers?: Record<string, string | number | boolean>) {
        this.status = status;
        this.statusDescription = description;
        if (headers != null) {
            for (const key of Object.keys(headers)) {
                const value = headers[key];
                this.header(key, value);
            }
        }
    }

    protected getBody(): string {
        if (this.body == null) {
            return JSON.stringify({ status: this.status, message: this.statusDescription });
        }
        if (Buffer.isBuffer(this.body)) {
            return this.body.toString('base64');
        }
        return this.body;
    }

    /** Convert this response object to the format that is expected by lambda */
    public abstract toResponse(): ALBResult | CloudFrontRequestResult;
    /** Set a header inside inside the response */
    public abstract header(key: string, value: string | number | boolean): void;
}
