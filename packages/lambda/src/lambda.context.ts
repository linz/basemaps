import { Metrics } from '@linzjs/metrics';
import { ALBEvent, ALBResult, CloudFrontRequestEvent, CloudFrontRequestResult } from 'aws-lambda';
import * as ulid from 'ulid';
import { toAlbHeaders, toCloudFrontHeaders } from './lambda.aws';
import * as qs from 'querystring';
import { HttpHeader } from './header';
import { LambdaHttpResponse } from './lambda.response';
import { Const } from '@basemaps/shared';

export interface ActionData {
    version: string;
    name: string;
    rest: string[];
}

export type LambdaHttpRequestType = ALBEvent | CloudFrontRequestEvent;
export type LambdaHttpReturnType = ALBResult | CloudFrontRequestResult;

/** Mininmal logging interface should be satisfiable by something like pino */
export interface LogType {
    child(args: Record<string, unknown>): LogType;
    info(args: Record<string, unknown>, msg: string): void;
    debug(args: Record<string, unknown>, msg: string): void;
    trace(args: Record<string, unknown>, msg: string): void;
    warn(args: Record<string, unknown>, msg: string): void;
    error(args: Record<string, unknown>, msg: string): void;
    fatal(args: Record<string, unknown>, msg: string): void;
}

export class LambdaContext {
    static isAlbEvent(evt: any): evt is ALBEvent {
        return Array.isArray(evt['Records']) === false;
    }

    static isCloudFrontEvent(evt: any): evt is CloudFrontRequestEvent {
        return Array.isArray(evt['Records']) === true;
    }

    public id: string;
    public correlationId: string;
    public logContext: Record<string, unknown> = {};
    public timer: Metrics = new Metrics();

    public log: LogType;
    public evt: LambdaHttpRequestType;
    public apiKey: string | undefined;

    headers: Map<string, string> = new Map();

    constructor(evt: LambdaHttpRequestType, logger: LogType) {
        this.evt = evt;
        this.id = ulid.ulid();
        this.loadHeaders();
        const apiKey = this.query[Const.ApiKey.QueryString] ?? this.header(HttpHeader.ApiKey);
        if (apiKey != null && !Array.isArray(apiKey)) {
            this.apiKey = apiKey;
            this.set(Const.ApiKey.QueryString, this.apiKey);
        }
        this.correlationId = this.header(HttpHeader.CorrelationId) ?? ulid.ulid();
        this.set('correlationId', this.correlationId);
        this.log = logger.child({ id: this.id });
    }

    private loadHeaders(): void {
        const evt = this.evt;
        if (LambdaContext.isAlbEvent(evt)) {
            for (const [key, value] of Object.entries(evt.headers ?? {})) {
                this.headers.set(key.toLowerCase(), value);
            }
        } else {
            for (const [key, value] of Object.entries(evt.Records[0].cf.request.headers)) {
                this.headers.set(key.toLowerCase(), value[0]?.value);
            }
        }
    }

    get method(): string {
        if (LambdaContext.isAlbEvent(this.evt)) {
            return this.evt.httpMethod.toLowerCase();
        }
        return this.evt.Records[0].cf.request.method.toLowerCase();
    }

    get path(): string {
        if (LambdaContext.isAlbEvent(this.evt)) {
            return this.evt.path;
        }
        return this.evt.Records[0].cf.request.uri;
    }

    get query(): Record<string, string | string[] | undefined> {
        if (LambdaContext.isAlbEvent(this.evt)) {
            return this.evt.queryStringParameters ?? {};
        }
        const query = this.evt.Records[0].cf.request.querystring;
        if (query == null || query[0] == null) return {};
        return qs.decode(query[0] === '?' ? query.substr(1) : query);
    }

    /**
     * Read a header from the event object
     * @param key header to read
     */
    header(key: string): string | undefined {
        return this.headers.get(key.toLowerCase());
    }

    private _action: ActionData | null;
    get action(): ActionData {
        if (this._action == null) {
            const path = this.path;
            const [version, name, ...rest] = (path[0] === '/' ? path.slice(1) : path).split('/');
            if (name == null) {
                this._action = { version: 'v1', name: version, rest: [] };
            } else {
                this._action = { version, name, rest };
            }
        }
        return this._action;
    }

    /**
     * Set a key to be logged out at the end of the function call
     * @param key key to log as
     * @param val value to log
     */
    public set(key: string, val: any): void {
        if (val == null) {
            delete this.logContext[key];
        } else {
            this.logContext[key] = val;
        }
    }

    public static toResponse(req: LambdaContext, res: LambdaHttpResponse): LambdaHttpReturnType {
        const evt = req.evt;

        res.header(HttpHeader.CorrelationId, req.correlationId);
        res.header(HttpHeader.RequestId, req.id);
        if (LambdaContext.isAlbEvent(evt)) {
            return LambdaContext.toAlbResponse(res);
        }
        return LambdaContext.toCloudFrontResponse(res, evt);
    }

    static toCloudFrontResponse(res: LambdaHttpResponse, req?: CloudFrontRequestEvent): CloudFrontRequestResult {
        // Continue
        if (res.status === 100 && req != null) {
            const outRequest = req.Records[0].cf.request;
            for (const [key, value] of res.headers) {
                outRequest.headers[key.toLowerCase()] = [{ key, value: String(value) }];
            }
            return req.Records[0].cf.request;
        }

        return {
            status: String(res.status),
            statusDescription: res.statusDescription,
            body: res.getBody(),
            headers: toCloudFrontHeaders(res.headers),
            bodyEncoding: 'text',
        };
    }

    static toAlbResponse(res: LambdaHttpResponse): ALBResult {
        return {
            statusCode: res.status,
            statusDescription: res.statusDescription,
            body: res.getBody(),
            headers: toAlbHeaders(res.headers) ?? undefined,
            isBase64Encoded: res.isBase64Encoded,
        };
    }
}
