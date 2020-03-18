import {
    LambdaHttpResponseAlb,
    LambdaSession,
    LogType,
    ReqInfo,
    Router,
    LambdaType,
    LambdaFunction,
} from '@basemaps/lambda-shared';
import { ALBEvent } from 'aws-lambda';
import health from './health';
import ping from './ping';
import tile from './tile-request';
import version from './version';

const app = new Router(
    (status: number, description: string, headers?: Record<string, string>): LambdaHttpResponseAlb =>
        new LambdaHttpResponseAlb(status, description, headers),
);

app.get('ping', ping);
app.get('health', health);
app.get('version', version);
app.get('tiles', tile);

class ReqInfoAlb extends ReqInfo {
    event: ALBEvent;
    private _httpMethod: string;

    constructor(event: ALBEvent, session: LambdaSession, logger: LogType) {
        super(session, logger);
        this.event = event;
        this._httpMethod = event.httpMethod.toLowerCase();
    }

    get httpMethod(): string {
        return this._httpMethod;
    }
    get urlPath(): string {
        return this.event.path;
    }
    getHeader(key: string): string | null {
        const { headers } = this.event;
        return headers ? headers[key.toLowerCase()] : null;
    }
}

export async function handleRequest(
    event: ALBEvent,
    session: LambdaSession,
    logger: LogType,
): Promise<LambdaHttpResponseAlb> {
    const info = new ReqInfoAlb(event, session, logger);

    session.set('name', 'LambdaXyzTiler');
    session.set('method', info.httpMethod);
    session.set('path', event.path);

    return (await app.handle(info)) as LambdaHttpResponseAlb;
}

export const handler = LambdaFunction.wrap(LambdaType.Alb, handleRequest);
