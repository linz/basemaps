import { HttpHeader, LambdaContext, LambdaHttpResponse } from '@basemaps/lambda';
import { Aws, FileOperator, TileDataXyz, TileSetType, TileSetVectorRecord, VectorFormat } from '@basemaps/shared';
import { SourceAwsS3 } from '@cogeotiff/source-aws';
import { Cotar, TarIndex } from '@cotar/core';
import { NotFound } from './routes/tile';
import { TileSetHandler } from './tile.set';

class CotarCache {
    cache = new Map<string, Promise<Cotar | null>>();

    get(uri: string): Promise<Cotar | null> {
        let cotar = this.cache.get(uri);
        if (cotar == null) {
            cotar = this.loadCotar(uri);
            this.cache.set(uri, cotar);
        }
        return cotar;
    }

    async loadCotar(uri: string): Promise<Cotar | null> {
        const source = SourceAwsS3.fromUri(uri, Aws.s3);
        if (source == null) return null;

        const index = await FileOperator.readJson<TarIndex>(uri + '.index.gz');
        return new Cotar(source, index);
    }
}

export const Layers = new CotarCache();

export class TileSetVector extends TileSetHandler<TileSetVectorRecord> {
    type = TileSetType.Vector;

    async tile(req: LambdaContext, xyz: TileDataXyz): Promise<LambdaHttpResponse> {
        if (xyz.ext !== VectorFormat.MapboxVectorTiles) return NotFound;
        if (this.tileSet.layers.length > 1) return new LambdaHttpResponse(500, 'Too many layers in tileset');
        // const [layerUri] = this.tileSet.layers;
        const layerUri = 's3://basemaps-cog-test/2021-04-08-covt/2021-04-08.tar';

        req.timer.start('cotar:load');
        const cotar = await Layers.get(layerUri);
        if (cotar == null) return new LambdaHttpResponse(500, 'Failed to load VectorTiles');
        req.timer.end('cotar:load');
        if (cotar.index.size === 0) {
            req.timer.start('cotar:index');
            cotar.init();
            req.timer.end('cotar:index');
        }

        // Flip Y coordinate because MBTiles files are TMS.
        const y = (1 << xyz.z) - 1 - xyz.y;

        req.timer.start('cotar:tile');
        const tile = await cotar.get(`tiles/${xyz.z}/${xyz.x}/${y}.pbf.gz`, req.log);
        if (tile == null) return NotFound;
        req.timer.end('cotar:tile');

        const response = new LambdaHttpResponse(200, 'Ok');
        response.buffer(Buffer.from(tile), 'application/x-protobuf');
        response.header(HttpHeader.ContentEncoding, 'gzip');
        return response;
    }
}
