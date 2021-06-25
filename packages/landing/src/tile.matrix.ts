import { GoogleTms, Nztm2000QuadTms, Nztm2000Tms, TileMatrixSet } from '@basemaps/geo';
import { MapLocation, MapOptions, MapOptionType, WindowUrl } from './url';
import { Style } from 'maplibre-gl';
import { Projection } from '@basemaps/shared/build/proj/projection';

export class TileGrid {
    tileMatrix: TileMatrixSet;
    extraZoomLevels: number;
    constructor(tileMatrix: TileMatrixSet, extraZoomLevels = 0) {
        this.tileMatrix = tileMatrix;
        this.extraZoomLevels = extraZoomLevels;
    }

    getStyle(config: MapOptions): Style | string {
        if (config.imageId === 'topographic') return WindowUrl.toTileUrl(config, MapOptionType.TileVector);
        return {
            version: 8,
            sources: {
                basemaps: {
                    type: 'raster',
                    tiles: [WindowUrl.toTileUrl(config, MapOptionType.TileRaster)],
                    tileSize: 256,
                },
            },
            layers: [
                {
                    id: 'LINZ Raster Basemaps',
                    type: 'raster',
                    source: 'basemaps',
                },
            ],
        };
    }
}

const Nztm2000TileGrid = new TileGrid(Nztm2000Tms, 2);
const Nztm2000QuadTileGrid = new TileGrid(Nztm2000QuadTms);
const GoogleTileGrid = new TileGrid(GoogleTms);

const Grids = [Nztm2000TileGrid, Nztm2000QuadTileGrid, GoogleTileGrid];

export function getTileGrid(id: string): TileGrid {
    for (const g of Grids) {
        if (id === g.tileMatrix.identifier) return g;
    }
    return GoogleTileGrid;
}

/**
 * Transform the location coordinate between mapbox and another tileMatrix.
 * One of the tileMatrix or targetTileMatrix has to be MapboxTms(GoogleTms)
 */
export function locationTransform(
    location: MapLocation,
    tileMatrix: TileMatrixSet,
    targetTileMatrix: TileMatrixSet,
): MapLocation {
    if (tileMatrix.identifier === targetTileMatrix.identifier) return location;
    const projection = Projection.get(tileMatrix);
    const coords = projection.fromWgs84([location.lon, location.lat]);
    const center = tileMatrix.sourceToPixels(coords[0], coords[1], Math.round(location.zoom));
    const tile = { x: center.x / tileMatrix.tileSize, y: center.y / tileMatrix.tileSize, z: Math.round(location.zoom) };
    const mapboxTile = targetTileMatrix.tileToSource(tile);
    const [lon, lat] = Projection.get(targetTileMatrix).toWgs84([mapboxTile.x, mapboxTile.y]);
    return { lon, lat, zoom: location.zoom };
}
