import { TileMatrixSet } from '@basemaps/geo';
import { LambdaContext, LambdaHttpResponse } from '@basemaps/lambda';
import { TileDataXyz, TileMetadataSetRecordV2, TileSetNameParser, TileSetVectorRecord } from '@basemaps/shared';
import { TileSetNameComponents } from 'packages/shared/src/tile.set.name';
import { TileSets } from './tile.set.cache';
import { TileSetRaster } from './tile.set.raster';
import { TileSetVector } from './tile.set.vector';

export type TileSet = TileSetVector | TileSetRaster;

export abstract class TileSetHandler<T extends TileMetadataSetRecordV2 | TileSetVectorRecord> {
    type: 'vector' | 'raster';
    components: TileSetNameComponents;
    tileMatrix: TileMatrixSet;
    tileSet: T;
    constructor(name: string, tileMatrix: TileMatrixSet) {
        this.components = TileSetNameParser.parse(name);
        this.tileMatrix = tileMatrix;
    }

    get id(): string {
        return TileSets.id(this.fullName, this.tileMatrix);
    }

    get fullName(): string {
        return TileSetNameParser.componentsToName(this.components);
    }

    abstract tile(req: LambdaContext, xyz: TileDataXyz): Promise<LambdaHttpResponse>;
}
