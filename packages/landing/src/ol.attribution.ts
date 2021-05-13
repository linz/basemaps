import { Attribution } from '@basemaps/attribution';
import { AttributionCollection, Epsg, Stac } from '@basemaps/geo';
import { View } from 'ol';
import { Extent } from 'ol/extent';
import OlMap from 'ol/Map';
import MapEventType from 'ol/MapEventType';
import { transformExtent } from 'ol/proj';
import Source from 'ol/source/Source';
import { Wgs84 } from '@linzjs/geojson';
import { MapOptions, MapOptionType, WindowUrl } from './url';

const Copyright = `© ${Stac.License} LINZ`;

function sameExtent(a: Extent, b: Extent): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

/**
 * Handles displaying attributions for the OpenLayers interface
 */
export class OlAttribution {
    source: Source;
    view: View;
    config: MapOptions;

    /** handle for scheduleRender setTimeout */
    private _scheduled: number | NodeJS.Timeout | undefined;
    /** handle for scheduleRender requestAnimationFrame */
    private _raf = 0;

    attributions: Attribution | null = null;
    attributionHTML = '';
    extent: Extent = [0, 0, 0, 0];
    zoom = -1;
    filteredRecords: AttributionCollection[] = [];

    /**
     * Initialize monitoring the OpenLayers map and set the source attributions when changed.
     */
    static init(source: Source, map: OlMap, config: MapOptions): void {
        const attribution = new OlAttribution(source, map.getView(), config);

        map.addEventListener(MapEventType.MOVEEND, (): boolean => {
            attribution.updateAttribution();
            return true;
        });
    }

    constructor(source: Source, view: View, config: MapOptions) {
        this.source = source;
        this.view = view;
        this.config = config;
    }

    _attributionLoad: Promise<Attribution> | null;
    /**
     * Trigger an attribution text update. Will fetch attributions if needed
     */
    updateAttribution(): void {
        if (this._attributionLoad == null) {
            this.source.setAttributions((this.attributionHTML = 'Loading…'));
            this._attributionLoad = Attribution.load(WindowUrl.toTileUrl(this.config, MapOptionType.Attribution)).then(
                (attr) => {
                    this.attributions = attr;
                    this.scheduleRender();
                    return attr;
                },
            );
        }
        this.scheduleRender();
    }

    /**
     * Only update attributions at most every 200ms
     */
    scheduleRender(): void {
        if (this._scheduled != null || this._raf !== 0) return;
        if (this.view.getZoom() === this.zoom) {
            const extent = this.view.calculateExtent();
            if (sameExtent(this.extent, extent)) return;
        }
        this.zoom = this.view.getZoom() ?? 0;
        this.extent = this.view.calculateExtent();
        this._scheduled = setTimeout(() => {
            this._scheduled = undefined;
            this._raf = requestAnimationFrame(this.renderAttribution);
        }, 200);
    }

    /**
     * Set the attribution text if needed
     */
    renderAttribution = (): void => {
        this._raf = 0;
        if (this.attributions == null) return;
        this.zoom = Math.round(this.view.getZoom() ?? 0);
        this.extent = this.view.calculateExtent();

        const wgs84Extent = Wgs84.normExtent(
            transformExtent(this.extent, this.view.getProjection().getCode(), Epsg.Wgs84.toEpsgString()),
        );
        const filtered = this.attributions.filter(wgs84Extent, this.zoom);
        let attributionHTML = this.attributions.renderList(filtered);
        if (attributionHTML === '') {
            attributionHTML = Copyright;
        } else {
            attributionHTML = Copyright + ' - ' + attributionHTML;
        }
        if (attributionHTML !== this.attributionHTML) {
            this.source.setAttributions((this.attributionHTML = attributionHTML));
        }

        this.filteredRecords = filtered;
    };
}
