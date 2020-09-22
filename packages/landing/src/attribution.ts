import { AttributionCollection, AttributionStac } from '@basemaps/shared/build/attribution';
import { StacLicense } from '@basemaps/shared/build/stac';
import { BBox, Wgs84 } from '@linzjs/geojson';
import { View } from 'ol';
import { Extent } from 'ol/extent';
import OlGeometryLayout from 'ol/geom/GeometryLayout';
import OlPolygon from 'ol/geom/Polygon';
import OlMap from 'ol/Map';
import MapEventType from 'ol/MapEventType';
import { transformExtent } from 'ol/proj';
import Source from 'ol/source/Source';
import { MapOptions, MapOptionType, WindowUrl } from './url';

const Copyright = `© ${StacLicense} LINZ`;

class AttributionBounds {
    collection: AttributionCollection;
    boundaries: OlPolygon[] = [];
    minZoom: number;
    maxZoom: number;
    bbox: BBox;

    constructor(collection: AttributionCollection) {
        this.collection = collection;
        const zoom = collection.summaries['linz:zoom'];
        this.minZoom = zoom.min;
        this.maxZoom = zoom.max;
        this.bbox = collection.extent.spatial.bbox[0];
    }

    intersects(extent: Extent, zoom: number): boolean {
        if (zoom > this.maxZoom || zoom < this.minZoom || !Wgs84.intersects(extent, this.bbox)) {
            return false;
        }

        if (extent[0] < extent[2]) {
            return this.boundaries.find((p) => p.intersectsExtent(extent)) != null;
        }

        const ext1: Extent = [extent[0], extent[1], extent[2] + 360, extent[3]];
        if (this.boundaries.find((p) => p.intersectsExtent(ext1)) != null) {
            return true;
        }
        ext1[2] = extent[2];
        ext1[0] -= 360;

        return this.boundaries.find((p) => p.intersectsExtent(ext1)) != null;
    }
}

function convertToOlAttribution(stac: AttributionStac): AttributionBounds[] {
    const colMap = new Map<string, AttributionBounds>();
    const result: AttributionBounds[] = [];

    for (const collection of stac.collections) {
        const olattr = new AttributionBounds(collection);
        result.push(olattr);
        colMap.set(collection.id, olattr);
    }

    for (const f of stac.features) {
        const col = colMap.get(f.collection ?? '');
        if (col == null) {
            throw new Error('Could not match feature to collection: ' + f.collection);
        }
        if (f.geometry.type === 'Polygon') {
            col.boundaries.push(new OlPolygon(f.geometry.coordinates, OlGeometryLayout.XY));
        } else if (f.geometry.type === 'MultiPolygon') {
            for (const poly of f.geometry.coordinates) {
                col.boundaries.push(new OlPolygon(poly, OlGeometryLayout.XY));
            }
        }
    }

    return result;
}

async function fetchAttributions(url: string): Promise<AttributionBounds[] | null> {
    try {
        const resp = await fetch(url);
        if (resp.status < 300) {
            return convertToOlAttribution((await resp.json()) as AttributionStac);
        } else {
            throw new Error(`fetch attribution failed [${resp.status}] ${resp.statusText}`);
        }
    } catch (err) {
        console.error(err);
        return null;
    }
}

function sameExtent(a: Extent, b: Extent): boolean {
    if (a.length != b.length) return false;
    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function getYears(col: AttributionCollection): [number, number] {
    const { interval } = col.extent.temporal;
    if (interval == null || interval.length == 0) return [-1, -1];
    const range = interval[0];
    const y1 = new Date(range[0]).getFullYear();
    const y2 = (range.length < 2 ? y1 : new Date(range[1]).getFullYear()) - 1;

    return [y1, y2 < y1 ? y1 : y2];
}

function renderRecords(filtered: AttributionCollection[]): string {
    let result = Copyright;
    if (filtered.length == 0) return result;
    result += ` - ${filtered[0].title}`;
    if (filtered.length > 1) {
        if (filtered.length == 2) {
            result += ` & ${filtered[1].title}`;
        } else {
            let [minYear, maxYear] = getYears(filtered[1]);
            for (let i = 1; i < filtered.length; ++i) {
                const [a, b] = getYears(filtered[i]);
                if (a != -1 && (minYear == -1 || a < minYear)) minYear = a;
                if (b != -1 && (maxYear == -1 || b > maxYear)) maxYear = b;
            }
            if (minYear == -1) minYear = maxYear;
            if (maxYear != -1) {
                result += ` & others ${minYear}-${maxYear}`;
            }
        }
    }
    return result;
}

export class Attribution {
    source: Source;
    view: View;
    config: MapOptions;
    private _scheduled: any;
    private _raf = 0;
    attributions: AttributionBounds[] | null | undefined;
    attributionHTML = '';
    extent: Extent = [0, 0, 0, 0];
    zoom = -1;
    filteredRecords: AttributionCollection[] = [];

    static init(source: Source, map: OlMap, config: MapOptions): void {
        const attribution = new Attribution(source, map.getView(), config);

        map.addEventListener(MapEventType.MOVEEND, () => {
            attribution.updateAttribution().catch((err) => {
                console.error(err);
            });
        });
    }

    constructor(source: Source, view: View, config: MapOptions) {
        this.source = source;
        this.view = view;
        this.config = config;
    }

    async updateAttribution(): Promise<void> {
        if (this.attributions == null) {
            if (this.attributions === null) return; // already fetching
            this.attributions = null;
            this.source.setAttributions((this.attributionHTML = 'Loading…'));
            this.attributions = await fetchAttributions(WindowUrl.toTileUrl(this.config, MapOptionType.Attribution));
        }
        this.scheduleRender();
    }

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

    renderAttribution = (): void => {
        this._raf = 0;
        if (this.attributions == null) {
            if (Copyright !== this.attributionHTML) {
                this.source.setAttributions((this.attributionHTML = Copyright));
            }
            return;
        }
        const { attributions } = this;
        const zoom = (this.zoom = Math.round(this.view.getZoom()));
        this.extent = this.view.calculateExtent();
        const extent = Wgs84.normExtent(transformExtent(this.extent, this.view.getProjection(), 'EPSG:4326'));
        const filtered: AttributionCollection[] = [];
        for (let i = attributions.length - 1; i >= 0; --i) {
            const row = attributions[i];
            if (row.intersects(extent, zoom)) {
                filtered.push(row.collection);
            }
        }
        const attributionHTML = renderRecords(filtered);
        if (attributionHTML !== this.attributionHTML) {
            this.source.setAttributions((this.attributionHTML = attributionHTML));
        }

        this.filteredRecords = filtered;
    };
}
