import { LambdaContext, LogConfig } from '@basemaps/lambda-shared';
import { TileSet } from '../tile.set';

export function mockRequest(path: string, method = 'get', headers = {}): LambdaContext {
    return new LambdaContext(
        {
            requestContext: null as any,
            httpMethod: method.toUpperCase(),
            path,
            headers,
            body: null,
            isBase64Encoded: false,
        },
        LogConfig.get(),
    );
}

export function addTitleAndDesc(tileSet: TileSet, title = 'The Title', description = 'The Description'): void {
    (tileSet as any).tileSet = {
        title,
        description,
    };
}
