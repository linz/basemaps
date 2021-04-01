import { LambdaContext, LambdaHttpResponse } from '@basemaps/lambda';
import { TileDataXyz, TileSetVectorRecord } from '@basemaps/shared';
import { TileSetHandler } from './tile.set';

export class TileSetVector extends TileSetHandler<TileSetVectorRecord> {
    type = 'vector' as const;

    tile(req: LambdaContext, xyz: TileDataXyz): Promise<LambdaHttpResponse> {
        throw new Error('Not Yet Implemented: ' + req.id + xyz.x);
    }
}
