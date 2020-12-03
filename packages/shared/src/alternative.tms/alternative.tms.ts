import { TileMatrixSet, TileMatrixSetType } from '@basemaps/geo';

export class AlternativeTileMatrixSet extends TileMatrixSet {
    altName: string;
    parent: TileMatrixSet;
    scaleMap: Map<number, number>;

    constructor(def: TileMatrixSetType, parent: TileMatrixSet, altName: string) {
        super(def);
        this.parent = parent;
        this.altName = altName;
        this.scaleMap = TileMatrixSet.scaleMapping(this.parent, this);
    }

    getParentZoom(z: number): number {
        const convertZ = this.scaleMap.get(z);
        if (convertZ == null) throw new Error(`No converted zoom from parent Tile Matrix for zoom: ${z}`);
        return convertZ;
    }

    get id(): string {
        return TileMatrixSet.getId(this.projection, this.altName);
    }
}
