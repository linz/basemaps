import { GoogleTms, Nztm2000QuadTms, Nztm2000Tms } from '@basemaps/geo';
// import { gaEvent, GaEvent } from './config';
// import { OlAttribution } from './ol.attribution';
import { getNZTMTile, getTileGrid, getWgs84FromNZTM } from './tile.matrix';
import { MapLocation, MapOptions, WindowUrl } from './url';
import mapboxgl from 'maplibre-gl';
import { Projection } from '@basemaps/shared/build/proj/projection';

/** Projection to use for the URL bar */
// const UrlProjection = Epsg.Wgs84.toEpsgString();

/** Default center point if none provided */
const DefaultCenter: Record<string, MapLocation> = {
    [GoogleTms.identifier]: { lat: -41.88999621, lon: 174.04924373, zoom: 5 },
    [Nztm2000Tms.identifier]: { lat: -41.277848, lon: 174.6763921, zoom: 3 },
    [Nztm2000QuadTms.identifier]: { lat: -41.88999621, lon: 174.04924373, zoom: 4 },
};

// export interface TileLoadEvent extends BaseEvent {
//     type: 'tileloadstart' | 'tileloadend';
//     tile: ImageTile;
//     target: unknown;
// }

// function isTileLoadEvent(e: BaseEvent): e is TileLoadEvent {
//     return e.type === 'tileloadstart' || e.type === 'tileloadend';
// }

// /** Dont report loading stats of less than this number of tiles */
// const TileMinReportCount = 100;
// /** Attempt to report timer stats */
// const TileReportTimeDurationMs = 30 * 1000;

export class Basemaps {
    map: mapboxgl.Map;
    el: HTMLElement;
    config: MapOptions;
    location: Location;

    tileTimer: Map<string, number> = new Map();
    /** Duration in ms for each tile loaded */
    tileLoadTimes: number[] = [];

    constructor(target: HTMLElement) {
        this.el = target;
        this.updateFromUrl();

        window.addEventListener('popstate', () => {
            const location = this.getLocationFromHash();
            this.map.setZoom(location.zoom);
            this.map.setCenter([location.lon, location.lat]);
        });
    }

    private getLocationFromHash(): MapLocation {
        return { ...DefaultCenter[this.config.tileMatrix.identifier], ...WindowUrl.fromHash(window.location.hash) };
    }

    /** Import location and rendering information from the url */
    private updateFromUrl(): void {
        this.config = WindowUrl.fromUrl(window.location.search);
        const location = this.getLocationFromHash();
        const tileGrid = getTileGrid(this.config.tileMatrix.identifier);
        const style = tileGrid.getStyle(this.config);

        // source.addEventListener('tileloadstart', this.trackTileLoad);
        // source.addEventListener('tileloadend', this.trackTileLoad);

        const coordinate = getWgs84FromNZTM(getNZTMTile(tileGrid.tileMatrix, location));

        this.map = new mapboxgl.Map({
            container: 'map',
            style,
            center: coordinate, // starting position [lon, lat]
            zoom: location.zoom, // starting zoom
        });

        if (tileGrid.tileMatrix.identifier !== GoogleTms.identifier) this.map.setMaxBounds([-180, -85.06, 180, 85.06]);

        // OlAttribution.init(source, this.map, this.config);

        // this.map.addEventListener('postrender', this.postRender);
    }

    // tileTrackTimer: unknown | null = null;
    // trackTileLoad = (evt: BaseEvent): boolean => {
    //     if (!isTileLoadEvent(evt)) return true;
    //     const metricName = 'tile:' + evt.tile.getTileCoord().join('-');
    //     if (evt.type === 'tileloadstart') {
    //         this.tileTimer.set(metricName, Date.now());
    //         return true;
    //     }

    //     if (evt.type === 'tileloadend') {
    //         const startTime = this.tileTimer.get(metricName);
    //         if (startTime == null) return true;
    //         this.tileTimer.delete(metricName);
    //         const duration = Date.now() - startTime;
    //         this.tileLoadTimes.push(duration);
    //         if (this.tileTrackTimer == null) {
    //             this.tileTrackTimer = setTimeout(this.reportTileStats, TileReportTimeDurationMs);
    //         }
    //     }
    //     return true;
    // };

    // reportTileStats = (): void => {
    //     this.tileTrackTimer = null;
    //     const tileLoadTimes = this.tileLoadTimes;
    //     if (tileLoadTimes.length < TileMinReportCount) return;
    //     this.tileLoadTimes = [];
    //     tileLoadTimes.sort();

    //     const percentile95 = Math.floor(0.95 * tileLoadTimes.length);
    //     const percentile90 = Math.floor(0.9 * tileLoadTimes.length);

    //     gaEvent(GaEvent.TileTiming, 'render:count', tileLoadTimes.length);
    //     gaEvent(GaEvent.TileTiming, 'render:95%', tileLoadTimes[percentile95]);
    //     gaEvent(GaEvent.TileTiming, 'render:90%', tileLoadTimes[percentile90]);
    // };

    // updateUrlTimer: unknown | null = null;
    // postRender = (): boolean => {
    //     if (this.updateUrlTimer != null) return true;
    //     this.updateUrlTimer = setTimeout(() => this.updateUrl(), 1000);
    //     return true;
    // };

    // getLocation(): MapLocation {
    //     const center = this.map.getCenter();
    //     if (center == null) throw new Error('Invalid Map location');
    //     const projection = this.config.tileMatrix.projection;
    //     const [lon, lat] = proj
    //         .transform([center.lat, center.lng], projection.toEpsgString(), UrlProjection)
    //         .map((c: number) => Math.floor(c * 10e7) / 10e7); // Limit to 5 decimal places (TODO is 5 enough)

    //     const zoom = Math.floor((this.map.getZoom() ?? 0) * 10e3) / 10e3;
    //     return { lat, lon, zoom };
    // }

    // /** Update the window.location with the current location information */
    // updateUrl(): void {
    //     this.updateUrlTimer = null;
    //     const path = WindowUrl.toHash(this.getLocation());
    //     window.history.replaceState(null, '', path);
    // }
}
