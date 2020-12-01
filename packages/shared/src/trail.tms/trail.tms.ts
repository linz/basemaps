import { TileMatrixSet, TileMatrixSetType } from '@basemaps/geo';

export class TrailTileMatrixSet extends TileMatrixSet {
    altName: string;
    parent: TileMatrixSet;
    scale: number;

    constructor(def: TileMatrixSetType, parent: TileMatrixSet, altName: string) {
        super(def);
        this.parent = parent;
        this.altName = altName;

        // Setup the z mapping between child Tmx and parent Tmx based on the scaleDenominator
        this.scale = this.parent.def.tileMatrix.length / this.def.tileMatrix.length;
    }

    getParentZoom(z: number): number {
        return Math.round(z * this.scale);
    }
}
