import { ActionData, populateAction } from './api-path';
import { LambdaHttpResponse } from './lambda.response.http';
import { LogType } from './log';
import { LambdaSession } from './session';

export abstract class ReqInfo implements ActionData {
    version: string;
    action: string;
    rest: string[];
    session: LambdaSession;
    logger: LogType;
    constructor(session: LambdaSession, logger: LogType) {
        this.session = session;
        this.logger = logger;
    }

    get httpMethod(): string {
        return '';
    }
    get urlPath(): string {
        return '';
    }
    abstract getHeader(_key: string): string | null;
}

export type ReqCallback = (info: ReqInfo) => Promise<LambdaHttpResponse>;

type NewResponse = (status: number, description: string, headers?: Record<string, string>) => LambdaHttpResponse;

export class Router {
    newResponse: NewResponse;
    private handlers: Record<string, ReqCallback> = {};

    constructor(newResponse: NewResponse) {
        this.newResponse = newResponse;
    }

    async handle(info: ReqInfo): Promise<LambdaHttpResponse> {
        // Allow cross origin requests
        if (info.httpMethod === 'options') {
            return this.newResponse(200, 'Options', {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': 'false',
                'Access-Control-Allow-Methods': 'OPTIONS,GET,PUT,POST,DELETE',
            });
        }

        if (info.httpMethod !== 'get') {
            return this.newResponse(405, 'Method not allowed');
        }

        populateAction(info);
        const handler = info.version === 'v1' ? this.handlers[info.action] : null;
        if (handler == null) {
            return this.notFound();
        }

        return await handler(info);
    }

    notFound(): LambdaHttpResponse {
        return this.newResponse(404, 'Not Found');
    }

    get(path: string, handler: ReqCallback): void {
        if (this.handlers[path] != null) throw new Error(path + ' already registered');
        this.handlers[path] = handler;
    }
}
