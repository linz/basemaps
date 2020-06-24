import Map from 'ol/Map';
import { WindowUrl, MapOptions, MapOptionType, MapLocation } from './url';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import * as proj from 'ol/proj.js';
import WMTS from 'ol/source/WMTS.js';
import { Epsg } from '@basemaps/geo';
import { NztmOl } from './nztm2000';
import Layer from 'ol/layer/Layer';

/** Projection to use for the URL bar */
const UrlProjection = Epsg.Wgs84.toEpsgString();

/** Default center point if none provided */
const DefaultCenter: Record<number, MapLocation> = {
    [Epsg.Google.code]: { lat: -41.88999621, lon: 174.04924373, zoom: 6 },
    [Epsg.Nztm2000.code]: { lat: -41.277848, lon: 174.6763921, zoom: 2 },
};

export class Basemaps {
    map: Map;
    el: HTMLElement;
    config: MapOptions;
    location: Location;

    constructor(target: HTMLElement) {
        this.el = target;
        this.updateFromUrl();
    }

    getLayer(): Layer {
        const projection = this.config.projection;

        if (projection == Epsg.Google) {
            return new TileLayer({
                source: new XYZ({ url: WindowUrl.toTileUrl(this.config, MapOptionType.Tile) }),
            });
        }

        if (projection == Epsg.Nztm2000) {
            return new TileLayer({
                source: new WMTS({
                    url: WindowUrl.toTileUrl(this.config, MapOptionType.TileWmts),
                    requestEncoding: 'REST',
                    projection: projection.toEpsgString(),
                    tileGrid: NztmOl.TileGrid,
                    // These keys arent really needed but need to be strings
                    layer: '',
                    style: '',
                    matrixSet: '',
                }),
            });
        }

        throw new Error('Unable to find layer for projection: ' + projection);
    }
    /** Import location and rendering information from the url */
    private updateFromUrl(): void {
        this.config = WindowUrl.fromUrl(window.location.search);
        const projection = this.config.projection;
        const location = { ...DefaultCenter[projection.code], ...WindowUrl.fromHash(window.location.hash) };

        const loc = proj.transform([location.lon, location.lat], UrlProjection, `EPSG:${projection}`);
        let resolutions: undefined | number[] = undefined;
        if (projection == Epsg.Nztm2000) {
            resolutions = NztmOl.resolutions;
        }
        const view = new View({ projection: projection.toEpsgString(), center: loc, zoom: location.zoom, resolutions });

        this.map = new Map({
            target: this.el,
            view,
            layers: [this.getLayer()],
        });

        this.map.addEventListener('postrender', this.postRender);
    }

    updateUrlTimer: unknown | null = null;
    postRender = (): void => {
        if (this.updateUrlTimer != null) return;
        this.updateUrlTimer = setTimeout(() => this.updateUrl(), 1000);
    };

    getLocation(): MapLocation {
        const view = this.map.getView();
        const center = view.getCenter();
        if (center == null) throw new Error('Invalid Map location');
        const [lon, lat] = proj
            .transform(center, `EPSG:${this.config.projection}`, UrlProjection)
            .map((c: number) => Math.floor(c * 10e7) / 10e7); // Limit to 5 decimal places (TODO is 5 enough)

        const zoom = Math.floor(view.getZoom() * 10e3) / 10e3;
        return { lat, lon, zoom };
    }

    /** Update the window.location with the current location information */
    updateUrl(): void {
        this.updateUrlTimer = null;
        const path = WindowUrl.toHash(this.getLocation());
        window.history.replaceState(null, '', path);
    }
}
