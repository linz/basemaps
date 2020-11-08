import { TileMatrixSet, TileMatrixSetType } from '@basemaps/geo';

export class AltTileMatrixSet extends TileMatrixSet {
    altName: string;
    convertZ: (z: number) => number;
    constructor(def: TileMatrixSetType, altName: string, convertZ: (z: number) => number) {
        super(def);
        this.altName = altName;
        this.convertZ = convertZ;
    }
}
