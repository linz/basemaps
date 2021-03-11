import { Epsg, GoogleTms, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { Config } from './config';

export interface MapLocation {
    lat: number;
    lon: number;
    zoom: number;
}

export interface MapOptions {
    tag: string;
    imageId: string;
    tileMatrix: TileMatrixSet;
    /** Is the debug layer enabled @default false */
    debug: boolean;
}
export const enum MapOptionType {
    Tile = 'tile',
    TileWmts = 'tile-wmts',
    Wmts = 'wmts',
    Attribution = 'attribution',
}

export const WindowUrl = {
    ImageFormat: 'png',

    /**
     * Encode a location into the window.hash
     * Google uses ${lat},${lon},z${zoom}
     * TODO do we want to follow this
     */
    toHash(loc: MapLocation): string {
        return `#@${loc.lat},${loc.lon},z${loc.zoom}`;
    },

    /**
     * Support parsing of zooms with `z14` or `14z`
     * @param zoom string to parse zoom from
     */
    parseZoom(zoom: string | null): number {
        if (zoom == null || zoom === '') return NaN;
        if (zoom.startsWith('z')) return parseFloat(zoom.slice(1));
        if (zoom.endsWith('z')) return parseFloat(zoom);
        return NaN;
    },

    /** Parse a location from window.hash if it exists */
    fromHash(str: string): Partial<MapLocation> {
        const output: Partial<MapLocation> = {};
        const hash = str.replace('#@', '');
        const [latS, lonS, zoomS] = hash.split(',');
        const lat = parseFloat(latS);
        const lon = parseFloat(lonS);
        if (!isNaN(lat) && !isNaN(lon)) {
            output.lat = lat;
            output.lon = lon;
        }

        const newZoom = WindowUrl.parseZoom(zoomS);
        if (!isNaN(newZoom)) {
            output.zoom = newZoom;
        }

        return output;
    },

    fromUrl(search: string): MapOptions {
        const urlParams = new URLSearchParams(search);
        const tag = urlParams.get('v') ?? 'production';
        const imageId = urlParams.get('i') ?? 'aerial';
        const debug = urlParams.get('debug') != null;

        const projectionParam = urlParams.get('p') ?? GoogleTms.identifier;
        let tileMatrix = TileMatrixSets.find(projectionParam);
        if (tileMatrix == null) {
            tileMatrix = TileMatrixSets.get(Epsg.parse(projectionParam) ?? Epsg.Google);
        }

        return { tag, imageId, tileMatrix, debug };
    },

    baseUrl(): string {
        const baseUrl = Config.BaseUrl;
        if (baseUrl === '') return window.location.origin;
        if (!baseUrl.startsWith('http')) throw new Error('BaseURL must start with http(s)://');
        return baseUrl;
    },

    toTileUrl(opts: MapOptions, urlType: MapOptionType): string {
        const api = Config.ApiKey == null || Config.ApiKey === '' ? '' : `?api=${Config.ApiKey}`;
        const tag = opts.tag === 'production' ? '' : `@${opts.tag}`;
        const baseTileUrl = `${this.baseUrl()}/v1/tiles/${opts.imageId}${tag}/${opts.tileMatrix.identifier}`;

        if (urlType === MapOptionType.Tile) {
            return `${baseTileUrl}/{z}/{x}/{y}.${WindowUrl.ImageFormat}${api}`;
        }

        if (urlType === MapOptionType.TileWmts) {
            return `${baseTileUrl}/{TileMatrix}/{TileCol}/{TileRow}.${WindowUrl.ImageFormat}${api}`;
        }

        if (urlType === MapOptionType.Wmts) {
            return `${baseTileUrl}/WMTSCapabilities.xml${api}`;
        }

        if (urlType === MapOptionType.Attribution) {
            return `${baseTileUrl}/attribution.json${api}`;
        }

        throw new Error('Unknown url type: ' + urlType);
    },
};
