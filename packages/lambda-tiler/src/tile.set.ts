import { ConfigTileSetRaster, ConfigTileSetVector, TileSetType } from '@basemaps/config';
import { TileMatrixSet } from '@basemaps/geo';
import { LambdaContext, LambdaHttpResponse } from '@basemaps/lambda';
import { TileDataXyz, TileSetNameParser } from '@basemaps/shared';
import { TileSetNameComponents } from 'packages/shared/src/tile.set.name';
import { TileSets } from './tile.set.cache';
import { TileSetRaster } from './tile.set.raster';
import { TileSetVector } from './tile.set.vector';

export type TileSet = TileSetVector | TileSetRaster;

export abstract class TileSetHandler<T extends ConfigTileSetRaster | ConfigTileSetVector> {
    type: TileSetType;
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

    isVector(): this is TileSetVector {
        return this.type === TileSetType.Vector;
    }

    isRaster(): this is TileSetRaster {
        return this.type === TileSetType.Raster;
    }

    abstract tile(req: LambdaContext, xyz: TileDataXyz): Promise<LambdaHttpResponse>;
}
