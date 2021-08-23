import { Const } from '@basemaps/shared';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';

export type ReqCallback = (req: LambdaHttpRequest) => Promise<LambdaHttpResponse>;

export interface ActionData {
    version: string;
    name: string;
    rest: string[];
}

export class Router {
    static action(req: LambdaHttpRequest): ActionData {
        const path = req.path;
        const [version, name, ...rest] = (path[0] === '/' ? path.slice(1) : path).split('/');
        if (name == null) return { version: 'v1', name: version, rest: [] };
        return { version, name, rest };
    }

    static apiKey(req: LambdaHttpRequest): string | undefined {
        const apiKey = req.query.get(Const.ApiKey.QueryString) ?? req.header('X-LINZ-Api-Key');
        if (apiKey != null && !Array.isArray(apiKey)) {
            req.set(Const.ApiKey.QueryString, this.apiKey);
            return apiKey;
        }
        return;
    }

    private handlers: Record<string, ReqCallback> = {};

    async handle(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
        // Allow cross origin requests
        if (req.method === 'options') {
            return new LambdaHttpResponse(200, 'Options', {
                [HttpHeader.Cors]: '*',
                'Access-Control-Allow-Credentials': 'false',
                'Access-Control-Allow-Methods': 'OPTIONS,GET,PUT,POST,DELETE',
            });
        }

        if (req.method !== 'GET') return new LambdaHttpResponse(405, 'Method not allowed');

        const action = Router.action(req);
        const handler = action.version === 'v1' ? this.handlers[action.name] : null;
        if (handler == null) return new LambdaHttpResponse(404, 'Not Found');

        const response = await handler(req);
        response.header(HttpHeader.Cors, '*');
        return response;
    }

    get(path: string, handler: ReqCallback): void {
        if (this.handlers[path] != null) throw new Error(path + ' already registered');
        this.handlers[path] = handler;
    }
}
