import { Epsg, Tile } from '@basemaps/geo';
import { getImageFormat, ImageFormat } from '@basemaps/tiler';
import { ProjectionTileMatrixSet } from './proj/projection.tile.matrix.set';

export interface ActionData {
    version: string;
    action: string;
    rest: string[];
    urlPath: string;
}

export enum TileType {
    WMTS = 'WMTS',
    Image = 'image',
    Attribution = 'attribution',
}

export type TileData = TileDataXyz | TileDataWmts | TileDataAttribution;

export interface TileDataXyz extends Tile {
    type: TileType.Image;
    name: string;
    projection: Epsg;
    ext: ImageFormat;
}

export interface TileDataWmts {
    type: TileType.WMTS;
    name: string;
    projection: Epsg | null;
}

export interface TileDataAttribution {
    type: TileType.Attribution;
    name: string;
    projection: Epsg;
}

export function setNameAndProjection(req: { set: (key: string, val: any) => void }, data: TileData): void {
    req.set('tileSet', data.name);
    req.set('projection', data.projection);
}

function parseTargetEpsg(text: string): Epsg | null {
    const projection = Epsg.parse(text);
    if (projection == null || !Array.from(ProjectionTileMatrixSet.targetCodes()).includes(projection.code)) {
        return null;
    }
    return projection;
}

export function tileXyzFromPath(path: string[]): TileDataXyz | null {
    const name = path[0];
    const projection = parseTargetEpsg(path[1]);
    if (projection == null) return null;
    const z = parseInt(path[2], 10);
    const x = parseInt(path[3], 10);
    const [ystr, extStr] = path[4].split('.', 2);
    const y = parseInt(ystr, 10);

    if (isNaN(x) || isNaN(y) || isNaN(z)) return null;

    const ext = extStr ? getImageFormat(extStr) : null;
    if (ext == null) return null;

    return { type: TileType.Image, name, projection, x, y, z, ext };
}

export function tileAttributionFromPath(path: string[]): TileDataAttribution | null {
    if (path.length < 3) return null;

    const name = path[0];
    const projection = Epsg.parse(path[1]);
    if (projection == null) return null;

    return { type: TileType.Attribution, name, projection };
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
export function tileWmtsFromPath(path: string[]): TileDataWmts | null {
    if (path.length > 3) return null;

    const name = path.length == 1 ? '' : path[0];
    let projection = null;
    if (path.length == 3) {
        projection = parseTargetEpsg(path[1]);
        if (projection == null) return null;
    }

    return {
        type: TileType.WMTS,
        name,
        projection,
    };
}

const SubHandler: Record<string, (path: string[]) => TileData | null> = {
    'WMTSCapabilities.xml': tileWmtsFromPath,
    'attribution.json': tileAttributionFromPath,
};

/**
 * Extract tile variables (`tileSet`, `projection`, `x`, `y`, `z` and `ext`) from an array
 **/
export function tileFromPath(path: string[]): TileData | null {
    if (path.length < 1) return null;
    const subHandler = SubHandler[path[path.length - 1]];
    if (subHandler == null) {
        return tileXyzFromPath(path);
    }

    return subHandler(path);
}
