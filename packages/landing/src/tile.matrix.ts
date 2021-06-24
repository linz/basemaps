import { GoogleTms, Nztm2000QuadTms, Nztm2000Tms, TileMatrixSet } from '@basemaps/geo';
import { register } from 'ol/proj/proj4';
import TileSource from 'ol/source/Tile';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';
import Proj from 'proj4';
import { MapLocation, MapOptions, MapOptionType, WindowUrl } from './url';
import { Style } from 'maplibre-gl';
import { Projection } from '@basemaps/shared';

Proj.defs(
    'EPSG:2193',
    '+proj=tmerc +lat_0=0 +lon_0=173 +k=0.9996 +x_0=1600000 +y_0=10000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
);
register(Proj);

export class TileGrid {
    tileMatrix: TileMatrixSet;
    extraZoomLevels: number;
    constructor(tileMatrix: TileMatrixSet, extraZoomLevels = 0) {
        this.tileMatrix = tileMatrix;
        this.extraZoomLevels = extraZoomLevels;
    }

    _grid: WMTSTileGrid | null;
    getGrid(): WMTSTileGrid {
        if (this._grid == null) {
            const topLeft = this.tileMatrix.zooms[0].topLeftCorner;
            const origin = [topLeft[this.tileMatrix.indexX], topLeft[this.tileMatrix.indexY]]; // NZTM is defined as y,x not x,y
            const resolutions = this.tileMatrix.zooms.map((_, i) => this.tileMatrix.pixelScale(i));
            const matrixIds = this.tileMatrix.zooms.map((c) => c.identifier);
            // Add extra zoom levels
            for (let i = 0; i < this.extraZoomLevels; ++i) {
                resolutions.push(resolutions[resolutions.length - 1] / 2);
            }
            this._grid = new WMTSTileGrid({ origin, resolutions, matrixIds });
        }
        return this._grid;
    }

    getSource(config: MapOptions): TileSource {
        if (this.tileMatrix.identifier === GoogleTms.identifier) {
            return new XYZ({ url: WindowUrl.toTileUrl(config, MapOptionType.TileRaster) });
        }

        return new WMTS({
            url: WindowUrl.toTileUrl(config, MapOptionType.TileWmts),
            requestEncoding: 'REST',
            projection: this.tileMatrix.projection.toEpsgString(),
            tileGrid: this.getGrid(),
            // These keys arent really needed but need to be strings
            layer: '',
            style: '',
            matrixSet: '',
        });
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

    getView(): { resolutions?: number[]; extent?: [number, number, number, number] } | null {
        if (this.tileMatrix.identifier === GoogleTms.identifier) return null;
        return {
            resolutions: this.getGrid().getResolutions(),
            extent: this.tileMatrix.extent.toBbox(),
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
    const center = tileMatrix.sourceToPixels(coords[0], coords[1], Math.floor(location.zoom));
    const tile = { x: center.x / tileMatrix.tileSize, y: center.y / tileMatrix.tileSize, z: Math.floor(location.zoom) };
    const mapboxTile = targetTileMatrix.tileToSource(tile);
    const [lon, lat] = Projection.get(targetTileMatrix).toWgs84([mapboxTile.x, mapboxTile.y]);
    return { lon, lat, zoom: location.zoom };
}
