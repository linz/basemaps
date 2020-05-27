export interface TileMatrixSetType {
    type: string;
    title: string;
    abstract?: string;
    identifier: string;
    supportedCRS: string;
    wellKnownScaleSet?: string;
    boundingBox: {
        type: string;
        crs: string;
        lowerCorner: [number, number];
        upperCorner: [number, number];
    };
    tileMatrix: TileMatrixSetTypeMatrix[];
}

export interface TileMatrixSetTypeMatrix {
    type: string;
    identifier: string;
    scaleDenominator: number;
    topLeftCorner: [number, number];
    tileWidth: number;
    tileHeight: number;
    matrixWidth: number;
    matrixHeight: number;
}
