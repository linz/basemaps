import { GoogleTms, Nztm2000QuadTms, Nztm2000Tms } from '@basemaps/geo';
import { MapAttribution } from './attribution';
import { getTileGrid, locationTransform } from './tile.matrix';
import { MapLocation, MapOptions, WindowUrl } from './url';
import mapboxgl from 'maplibre-gl';

export const MapboxTms = GoogleTms;

/** Default center point if none provided */
const DefaultCenter: Record<string, MapLocation> = {
    [GoogleTms.identifier]: { lat: -41.88999621, lon: 174.04924373, zoom: 5 },
    [Nztm2000Tms.identifier]: { lat: -41.277848, lon: 174.6763921, zoom: 3 },
    [Nztm2000QuadTms.identifier]: { lat: -41.88999621, lon: 174.04924373, zoom: 3 },
};

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
            const coordinate = locationTransform(location, this.config.tileMatrix, MapboxTms);
            this.map.setCenter([coordinate.lon, coordinate.lat]);
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
        const coordinate = locationTransform(location, this.config.tileMatrix, MapboxTms);

        this.map = new mapboxgl.Map({
            container: 'map',
            style,
            center: coordinate, // starting position [lon, lat]
            zoom: location.zoom, // starting zoom
            attributionControl: false,
        });

        if (tileGrid.tileMatrix.identifier !== GoogleTms.identifier) this.map.setMaxBounds([-180, -85.06, 180, 85.06]);

        if (typeof style !== 'string') {
            MapAttribution.init(this.map, this.config);
        }

        this.map.resize();

        this.map.on('render', this.render);
    }

    updateUrlTimer: unknown | null = null;
    render = (): void => {
        if (this.updateUrlTimer != null) return;
        this.updateUrlTimer = setTimeout(() => this.updateUrl(), 1000);
    };

    getLocation(): MapLocation {
        const center = this.map.getCenter();
        if (center == null) throw new Error('Invalid Map location');
        const zoom = Math.floor((this.map.getZoom() ?? 0) * 10e3) / 10e3;
        const location: MapLocation = { lat: center.lat, lon: center.lng, zoom };
        const coordinate = locationTransform(location, MapboxTms, this.config.tileMatrix);
        return { lat: coordinate.lat, lon: coordinate.lon, zoom };
    }

    /** Update the window.location with the current location information */
    updateUrl(): void {
        this.updateUrlTimer = null;
        const path = WindowUrl.toHash(this.getLocation());
        window.history.replaceState(null, '', path);
    }
}
