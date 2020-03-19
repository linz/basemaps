import { Projection, EPSG } from '@basemaps/geo';
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
    ext: string;
}

export interface TileDataWmts {
    type: TileType.WMTS;
    tileSet: TileSetType;
    projection: EPSG | null;
}

const TileSets: Record<string, TileSetType> = {
    aerial: TileSetType.aerial,
};

/**
 * Fill in derived fields (`version`, `action` and `rest`) from `info.urlPath`
 **/
export const populateAction = (info: ActionData): void => {
    const path = info.urlPath;
    const [version, action, ...rest] = (path[0] === '/' ? path.slice(1) : path).split('/');
    if (action == null) {
        info.version = 'v1';
        info.action = version;
        info.rest = [];
    } else {
        info.version = version;
        info.action = action;
        info.rest = rest;
    }
};

/**
 * Extract tile variables (`tileSet`, `projection`, `x`, `y`, `z` and `ext`) from an array
 **/
export const tileFromPath = (path: string[]): TileData | null => {
    const tileSet = path.length != 0 ? TileSets[path[0]] : null;
    if (tileSet == null) return null;
    if (path.length != 5) {
        if (path.length < 4 && path[path.length - 1] == 'WMTSCapabilities.xml') {
            const projection = path.length == 2 ? null : Projection.parseEpsgString(path[1]);
            if (path.length != 2 && projection == null) return null;
            return {
                type: TileType.WMTS,
                tileSet,
                projection,
            };
        }
        return null;
    }

    const projection = Projection.parseEpsgString(path[1]);
    if (projection == null) return null;
    const z = parseInt(path[2], 10);
    const x = parseInt(path[3], 10);
    const [ystr, ext] = path[4].split('.', 2);
    const y = parseInt(ystr, 10);

    if (isNaN(x) || isNaN(y) || isNaN(z) || !/^(?:png)$/.test(ext)) return null;

    return { type: TileType.Image, tileSet, projection, x, y, z, ext };
};
