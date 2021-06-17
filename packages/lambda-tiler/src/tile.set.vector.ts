import { ConfigTileSetVector, TileSetType } from '@basemaps/config';
import { HttpHeader, LambdaContext, LambdaHttpResponse } from '@basemaps/lambda';
import { Aws, fsa, TileDataXyz, VectorFormat } from '@basemaps/shared';
import { SourceAwsS3 } from '@cogeotiff/source-aws';
import { Cotar } from '@cotar/core';
import { Readable } from 'stream';
import { createGunzip } from 'zlib';
import { NotFound } from './routes/tile';
import { TileSetHandler } from './tile.set';

function streamToBuffer(stream: Readable): Promise<Buffer> {
    const buffers: Buffer[] = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (data) => buffers.push(data));
        stream.on('end', () => resolve(Buffer.concat(buffers)));
        stream.on('error', reject);
    });
}

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

        const stream = fsa.readStream(`${uri}.index.gz`).pipe(createGunzip());
        const index = await streamToBuffer(stream);
        return new Cotar(source, index.toString().split('\n'));
    }
}

export const Layers = new CotarCache();

export class TileSetVector extends TileSetHandler<ConfigTileSetVector> {
    type = TileSetType.Vector;

    async tile(req: LambdaContext, xyz: TileDataXyz): Promise<LambdaHttpResponse> {
        if (xyz.ext !== VectorFormat.MapboxVectorTiles) return NotFound;
        if (this.tileSet.layers.length > 1) return new LambdaHttpResponse(500, 'Too many layers in tileset');
        const [layer] = this.tileSet.layers;
        if (layer[3857] == null) return new LambdaHttpResponse(500, 'Layer url not found from tileset Config');

        req.timer.start('cotar:load');
        const cotar = await Layers.get(layer[3857]);
        if (cotar == null) return new LambdaHttpResponse(500, 'Failed to load VectorTiles');
        req.timer.end('cotar:load');

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
