import { LambdaContext } from './lambda.context';
import { LambdaHttpResponse } from './lambda.response';
import { HttpHeader } from './header';

export type ReqCallback = (req: LambdaContext) => Promise<LambdaHttpResponse>;

export class Router {
    private handlers: Record<string, ReqCallback> = {};

    async handle(req: LambdaContext): Promise<LambdaHttpResponse> {
        // Allow cross origin requests
        if (req.method === 'options') {
            return new LambdaHttpResponse(200, 'Options', {
                [HttpHeader.Cors]: '*',
                'Access-Control-Allow-Credentials': 'false',
                'Access-Control-Allow-Methods': 'OPTIONS,GET,PUT,POST,DELETE',
            });
        }

        if (req.method !== 'get') {
            return new LambdaHttpResponse(405, 'Method not allowed');
        }

        const action = req.action;
        const handler = action.version === 'v1' ? this.handlers[action.name] : null;
        if (handler == null) {
            return new LambdaHttpResponse(404, 'Not Found');
        }

        const response = await handler(req);
        response.header(HttpHeader.Cors, '*');
        return response;
    }

    get(path: string, handler: ReqCallback): void {
        if (this.handlers[path] != null) throw new Error(path + ' already registered');
        this.handlers[path] = handler;
    }
}
