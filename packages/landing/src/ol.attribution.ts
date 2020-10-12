import { AttributionCollection } from '@basemaps/shared/build/attribution';
import { StacLicense } from '@basemaps/shared/build/stac';
import { View } from 'ol';
import { Extent } from 'ol/extent';
import OlMap from 'ol/Map';
import MapEventType from 'ol/MapEventType';
import Source from 'ol/source/Source';
import { Attribution } from '@basemaps/attribution';
import { MapOptions, MapOptionType, WindowUrl } from './url';

const Copyright = `© ${StacLicense} LINZ`;

function sameExtent(a: Extent, b: Extent): boolean {
    if (a.length != b.length) return false;
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
    private _scheduled: any;
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

        map.addEventListener(MapEventType.MOVEEND, () => {
            attribution.updateAttribution();
        });
    }

    constructor(source: Source, view: View, config: MapOptions) {
        this.source = source;
        this.view = view;
        this.config = config;
    }

    /**
     * Trigger an attribution text update. Will fetch attributions if needed
     */
    async updateAttribution(): Promise<void> {
        if (this.attributions == null) {
            this.source.setAttributions((this.attributionHTML = 'Loading…'));
            this.attributions = new Attribution(this.source.getProjection().getCode());
            await this.attributions.load(WindowUrl.toTileUrl(this.config, MapOptionType.Attribution));
        }
        this.scheduleRender();
    }

    /**
     * Only update attributions at most every 200ms
     */
    scheduleRender(): void {
        if (this._scheduled != null || this._raf != 0) return;
        if (this.view.getZoom() == this.zoom) {
            const extent = this.view.calculateExtent();
            if (sameExtent(this.extent, extent)) return;
        }
        this.zoom = this.view.getZoom();
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
        this.zoom = Math.round(this.view.getZoom());
        this.extent = this.view.calculateExtent();
        const filtered = this.attributions.filter(this.extent, this.zoom);
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
