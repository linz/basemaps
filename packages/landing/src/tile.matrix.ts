import { Nztm2000Tms, Nztm2000QuadTms, TileMatrixSet, GoogleTms } from '@basemaps/geo';
import { View } from 'ol';
import { register } from 'ol/proj/proj4';
import TileSource from 'ol/source/Tile';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';
import { Extent } from 'packages/attribution/node_modules/@types/ol/extent';
import Proj from 'proj4';
import { MapOptions, MapOptionType, WindowUrl } from './url';

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
            return new XYZ({ url: WindowUrl.toTileUrl(config, MapOptionType.Tile) });
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

    getView(): { resolutions?: number[]; extent?: Extent } | null {
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
