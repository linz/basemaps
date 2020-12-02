import { TileMatrixSet, TileMatrixSetType } from '@basemaps/geo';

export class AlternativeTileMatrixSet extends TileMatrixSet {
    altName: string;
    parent: TileMatrixSet;
    scaleMap: Map<number, number>;

    constructor(def: TileMatrixSetType, parent: TileMatrixSet, altName: string) {
        super(def);
        this.parent = parent;
        this.altName = altName;
        this.scaleMap = new Map();

        // Setup the z mapping between child Tmx and parent Tmx based on the scaleDenominator
        let last = null;
        for (const pTmx of this.parent.def.tileMatrix) {
            for (const cTmx of this.def.tileMatrix) {
                if (last == null) {
                    if (cTmx.scaleDenominator >= pTmx.scaleDenominator) {
                        this.scaleMap.set(Number(cTmx.identifier), Number(pTmx.identifier));
                    }
                } else if (this.parent.def.tileMatrix.indexOf(pTmx) == this.parent.def.tileMatrix.length - 1) {
                    if (cTmx.scaleDenominator <= pTmx.scaleDenominator) {
                        this.scaleMap.set(Number(cTmx.identifier), Number(pTmx.identifier));
                    }
                } else {
                    if (
                        cTmx.scaleDenominator >= pTmx.scaleDenominator &&
                        cTmx.scaleDenominator <= last.scaleDenominator
                    ) {
                        this.scaleMap.set(Number(cTmx.identifier), Number(last.identifier));
                    }
                }
            }
            last = pTmx;
        }
    }

    getParentZoom(z: number): number {
        const convertZ = this.scaleMap.get(z);
        if (convertZ == null) throw new Error(`No converted scaled level from parent Tile Matrix`);
        return convertZ;
    }

    get id(): string {
        return TileMatrixSet.getId(this.projection, this.altName);
    }
}
