import { Projection, EPSG } from '@basemaps/geo';
import { getImageFormat, ImageFormat } from '@basemaps/tiler';

export interface ActionData {
    version: string;
    action: string;
    rest: string[];
    urlPath: string;
}

export enum TileSetType {
    aerial = 'aerial',
}

export enum TileType {
    WMTS = 'WMTS',
    Image = 'image',
}

export type TileData = TileDataXyz | TileDataWmts;

export interface TileDataXyz {
    type: TileType.Image;
    tileSet: TileSetType;
    projection: EPSG;
    x: number;
    y: number;
    z: number;
    ext: ImageFormat;
}

export interface TileDataWmts {
    type: TileType.WMTS;
    tileSet: TileSetType;
    projection: EPSG | null;
}

const TileSets: Record<string, TileSetType> = {
    aerial: TileSetType.aerial,
};

function tileXyzFromPath(path: string[], tileSet: TileSetType): TileData | null {
    const projection = Projection.parseEpsgString(path[1]);
    if (projection == null) return null;
    const z = parseInt(path[2], 10);
    const x = parseInt(path[3], 10);
    const [ystr, extStr] = path[4].split('.', 2);
    const y = parseInt(ystr, 10);

    if (isNaN(x) || isNaN(y) || isNaN(z)) return null;

    const ext = getImageFormat(extStr);
    if (ext == null) return null;

    return { type: TileType.Image, tileSet, projection, x, y, z, ext };
}

/**
 * Extract WMTS information from a path
 *
 * @example
 * - /v1/aerial/2193/WMTSCapabilities
 * - /v1/aerial/WMTSCapabilities
 * @param path
 * @param tileSet
 */
function tileWmtsFromPath(path: string[], tileSet: TileSetType): TileData | null {
    if (path.length > 3) return null;
    if (path[path.length - 1] != 'WMTSCapabilities.xml') return null;

    let projection = null;
    if (path.length == 3) {
        projection = Projection.parseEpsgString(path[1]);
        if (projection == null) return null;
    }

    return {
        type: TileType.WMTS,
        tileSet,
        projection,
    };
}

/**
 * Extract tile variables (`tileSet`, `projection`, `x`, `y`, `z` and `ext`) from an array
 **/
export function tileFromPath(path: string[]): TileData | null {
    if (path.length < 1) return null;

    const tileSet = TileSets[path[0]];
    if (tileSet == null) return null;

    if (path.length == 5) {
        return tileXyzFromPath(path, tileSet);
    }

    return tileWmtsFromPath(path, tileSet);
}
