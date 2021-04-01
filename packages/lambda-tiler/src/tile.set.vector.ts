import { LambdaContext, LambdaHttpResponse } from '@basemaps/lambda';
import { Aws, TileDataXyz, TileSetType, TileSetVectorRecord } from '@basemaps/shared';
import { SourceAwsS3 } from '@cogeotiff/source-aws';
import { Covt } from '@covt/core';
import { NotFound } from './routes/tile';
import { TileSetHandler } from './tile.set';

export const Covts = new Map<string, Promise<Covt>>();

export class TileSetVector extends TileSetHandler<TileSetVectorRecord> {
    type = TileSetType.Vector;

    async tile(req: LambdaContext, xyz: TileDataXyz): Promise<LambdaHttpResponse> {
        if (this.tileSet.layers.length > 1) return new LambdaHttpResponse(500, 'Too many layers in tileset');
        const [layerUri] = this.tileSet.layers;

        let covt = Covts.get(layerUri);
        if (covt == null) {
            const source = SourceAwsS3.fromUri(layerUri, Aws.s3);
            const index = SourceAwsS3.fromUri(layerUri + '.index', Aws.s3);
            if (source == null || index == null) return new LambdaHttpResponse(500, 'Failed to load COVT');
            covt = Covt.create(source, index);
            Covts.set(layerUri, covt);
        }

        const actualCovt = await covt;
        const tile = await actualCovt.getTile(xyz.x, xyz.y, xyz.z, req.log);
        if (tile == null) return NotFound;
        const response = new LambdaHttpResponse(200, 'Ok');
        response.buffer(Buffer.from(tile.buffer), tile.mimeType);
        return response;
    }
}
