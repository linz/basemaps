import { Config } from './config';
import { Epsg } from '@basemaps/geo';

export interface MapLocation {
    lat: number;
    lon: number;
    zoom: number;
}

export interface MapOptions {
    projection: Epsg;
    tag: string;
    imageId: string;
    /** Is the debug layer enabled @default false */
    debug: boolean;
}
export const enum MapOptionType {
    Tile = 'tile',
    TileWmts = 'tile-wmts',
    Wmts = 'wmts',
}

export const DefaultExt = 'webp';

export const WindowUrl = {
    /**
     * Encode a location into the window.hash
     * Google uses ${lat},${lon},z${zoom}
     * TODO do we want to follow this
     */
    toHash(loc: MapLocation): string {
        return `#@${loc.lat},${loc.lon},z${loc.zoom}`;
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
        const newZoom = parseFloat((zoomS ?? '').substr(1));
        if (!isNaN(newZoom)) {
            output.zoom = newZoom;
        }

        return output;
    },

    fromUrl(search: string): MapOptions {
        const urlParams = new URLSearchParams(search);
        const tag = urlParams.get('v') ?? 'production';
        const imageId = urlParams.get('i') ?? 'aerial';
        const projection = Epsg.parse(urlParams.get('p') ?? `${Epsg.Google.code}`) ?? Epsg.Google;
        const debug = urlParams.get('debug') != null;

        return { tag, imageId, projection, debug };
    },

    toTileUrl(opts: MapOptions, urlType: MapOptionType): string {
        const tag = opts.tag == 'production' ? '' : `@${opts.tag}`;
        const api = Config.ApiKey == null ? '' : `?api=${Config.ApiKey}`;
        const baseUrl = Config.BaseUrl;
        if (baseUrl != '' && !baseUrl.startsWith('http')) {
            throw new Error('BaseURL must start with https://');
        }

        if (urlType == MapOptionType.Tile) {
            return `${baseUrl}/v1/tiles/${opts.imageId}${tag}/${opts.projection}/{z}/{x}/{y}.${DefaultExt}${api}`;
        }

        if (urlType == MapOptionType.TileWmts) {
            return `${baseUrl}/v1/tiles/${opts.imageId}${tag}/${opts.projection}/{TileMatrix}/{TileCol}/{TileRow}.${DefaultExt}${api}`;
        }

        if (urlType == MapOptionType.Wmts) {
            return `${baseUrl}/v1/tiles/${opts.imageId}${tag}/${opts.projection}/WMTSCapabilities.xml${api}`;
        }

        throw new Error('Unknown url type: ' + urlType);
    },
};
