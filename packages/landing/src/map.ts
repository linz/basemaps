import OlMap from 'ol/Map';
import { WindowUrl, MapOptions, MapOptionType, MapLocation } from './url';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import * as proj from 'ol/proj.js';
import WMTS from 'ol/source/WMTS.js';
import { Epsg } from '@basemaps/geo';
import { NztmOl } from './nztm2000';
import TileSource from 'ol/source/Tile';
import BaseEvent from 'ol/events/Event';
import { ImageTile } from 'ol';
import { gaEvent, GaEvent } from './config';
import { Extent } from 'ol/extent';

/** Projection to use for the URL bar */
const UrlProjection = Epsg.Wgs84.toEpsgString();

/** Default center point if none provided */
const DefaultCenter: Record<number, MapLocation> = {
    [Epsg.Google.code]: { lat: -41.88999621, lon: 174.04924373, zoom: 6 },
    [Epsg.Nztm2000.code]: { lat: -41.277848, lon: 174.6763921, zoom: 3 },
};

export interface TileLoadEvent extends BaseEvent {
    type: 'tileloadstart' | 'tileloadend';
    tile: ImageTile;
    target: unknown;
}

function isTileLoadEvent(e: BaseEvent): e is TileLoadEvent {
    return e.type == 'tileloadstart' || e.type == 'tileloadend';
}

/** Dont report loading stats of less than this number of tiles */
const TileMinReportCount = 100;
/** Attempt to report timer stats */
const TileReportTimeDurationMs = 30 * 1000;

export class Basemaps {
    map: OlMap;
    el: HTMLElement;
    config: MapOptions;
    location: Location;

    tileTimer: Map<string, number> = new Map();
    /** Duration in ms for each tile loaded */
    tileLoadTimes: number[] = [];

    constructor(target: HTMLElement) {
        this.el = target;
        this.updateFromUrl();
    }

    getSource(): TileSource {
        const projection = this.config.projection;

        if (projection == Epsg.Google) {
            return new XYZ({ url: WindowUrl.toTileUrl(this.config, MapOptionType.Tile) });
        }

        if (projection == Epsg.Nztm2000) {
            return new WMTS({
                url: WindowUrl.toTileUrl(this.config, MapOptionType.TileWmts),
                requestEncoding: 'REST',
                projection: projection.toEpsgString(),
                tileGrid: NztmOl.TileGrid,
                // These keys arent really needed but need to be strings
                layer: '',
                style: '',
                matrixSet: '',
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
        let extent: undefined | Extent = undefined;
        if (projection == Epsg.Nztm2000) {
            resolutions = NztmOl.resolutions;
            extent = NztmOl.extent;
        }
        const view = new View({
            projection: projection.toEpsgString(),
            center: loc,
            zoom: location.zoom,
            resolutions,
            extent,
        });

        const source = this.getSource();
        source.addEventListener('tileloadstart', this.trackTileLoad);
        source.addEventListener('tileloadend', this.trackTileLoad);
        const layer = new TileLayer({ source });
        this.map = new OlMap({
            target: this.el,
            view,
            layers: [layer],
            keyboardEventTarget: document,
        });

        this.map.addEventListener('postrender', this.postRender);
    }

    tileTrackTimer: unknown | null = null;
    trackTileLoad = (evt: BaseEvent): void => {
        if (!isTileLoadEvent(evt)) return;
        const metricName = 'tile:' + evt.tile.getTileCoord().join('-');
        if (evt.type == 'tileloadstart') {
            this.tileTimer.set(metricName, Date.now());
            return;
        }

        if (evt.type == 'tileloadend') {
            const startTime = this.tileTimer.get(metricName);
            if (startTime == null) return;
            this.tileTimer.delete(metricName);
            const duration = Date.now() - startTime;
            this.tileLoadTimes.push(duration);
            if (this.tileTrackTimer == null) {
                this.tileTrackTimer = setTimeout(this.reportTileStats, TileReportTimeDurationMs);
            }
        }
    };

    reportTileStats = (): void => {
        this.tileTrackTimer = null;
        const tileLoadTimes = this.tileLoadTimes;
        if (tileLoadTimes.length < TileMinReportCount) return;
        this.tileLoadTimes = [];
        tileLoadTimes.sort();

        const percentile95 = Math.floor(0.95 * tileLoadTimes.length);
        const percentile90 = Math.floor(0.9 * tileLoadTimes.length);

        gaEvent(GaEvent.TileTiming, 'render:count', tileLoadTimes.length);
        gaEvent(GaEvent.TileTiming, 'render:95%', tileLoadTimes[percentile95]);
        gaEvent(GaEvent.TileTiming, 'render:90%', tileLoadTimes[percentile90]);
    };

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
