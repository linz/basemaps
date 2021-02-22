import { AttributionCollection, AttributionStac } from '@basemaps/geo';
import { BBox } from '@linzjs/geojson';
import { Wgs84 } from '@linzjs/geojson/build/wgs84';
import { Extent } from 'ol/extent';
import OlGeometryLayout from 'ol/geom/GeometryLayout';
import OlPolygon from 'ol/geom/Polygon';
import { transformExtent } from 'ol/proj';

/** html escape function */
function escapeHtml(text: string): string {
    const elm = document.createElement('span');
    elm.textContent = text;
    return elm.innerHTML;
}

/** Wrapper around AttributionCollection data with added intersection attributes */
export class AttributionBounds {
    collection: AttributionCollection;
    /** The bounding box for this collection */
    bbox: BBox;
    /** The polygons this collection intersects with */
    boundaries: OlPolygon[] = [];
    minZoom: number;
    maxZoom: number;

    constructor(collection: AttributionCollection) {
        this.collection = collection;
        const zoom = collection.summaries['linz:zoom'];
        this.minZoom = zoom.min;
        this.maxZoom = zoom.max;
        this.bbox = collection.extent.spatial.bbox[0];
    }

    /**
     * Does this AttributionCollection intersect with `extent`

     * @param extent The extent to test for intersection against
     * @param zoom only test extent if `zoom` is between `minZoom` and `maxZoom`
     */
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

/** Build an Array of AttributionBounds from AttributionStac */
function convertToBounds(stac: AttributionStac): AttributionBounds[] {
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

/** Get the year range for an AttributionCollection */
function getYears(col: AttributionCollection): [number, number] {
    const { interval } = col.extent.temporal;
    if (interval == null || interval.length === 0) return [-1, -1];
    const range = interval[0];
    const y1 = new Date(range[0]).getFullYear();
    const y2 = (range.length < 2 ? y1 : new Date(range[1]).getFullYear()) - 1;

    return [y1, y2 < y1 ? y1 : y2];
}

/**
 * Given a list of all attributions this class will filter the list to just those attributions which
 * intersect with a given `extent` and `zoom` level
 */
export class Attribution {
    attributions: AttributionBounds[] | null;
    projection: string;

    /**
     * @param attributionStac a LINZ AttributionStac object containing all the attributions for the basemap
     * @param projection the projection of the extents supplied to `filter`
     */
    constructor(projection = 'EPSG:3857') {
        this.attributions = null;
        this.projection = projection;
    }

    /**
     * Fetch the AttributionStac from server and load into `attributions`

     * @param url the location of the AttributionStac file
     */
    async load(url: string): Promise<void> {
        const resp = await fetch(url);
        if (resp.status < 300) {
            const attributionStac = await resp.json();
            this.attributions = convertToBounds(attributionStac);
        } else {
            throw new Error(`fetch attribution failed [${resp.status}] ${resp.statusText}`);
        }
    }

    /**
     * Filter the attributions to just those that intersect with `extent` and `zoom`

     * @param extent a bounding box in the projection supplied to the constructor
     * @param zoom the zoom level the extent is viewed at
     */
    filter(extent: Extent, zoom: number): AttributionCollection[] {
        extent = Wgs84.normExtent(transformExtent(extent, this.projection, 'EPSG:4326'));
        zoom = Math.round(zoom);

        const filtered: AttributionCollection[] = [];
        const { attributions } = this;
        if (attributions != null) {
            for (let i = attributions.length - 1; i >= 0; --i) {
                const row = attributions[i];
                if (row.intersects(extent, zoom)) {
                    filtered.push(row.collection);
                }
            }
        }
        return filtered;
    }

    /**
     * Render the filtered attributions as a simple string suitable to display as attribution

     * @param list the filtered list of attributions
     */
    renderList(list: AttributionCollection[]): string {
        if (list.length === 0) return '';
        let result = escapeHtml(list[0].title);
        if (list.length > 1) {
            if (list.length === 2) {
                result += ` & ${escapeHtml(list[1].title)}`;
            } else {
                let [minYear, maxYear] = getYears(list[1]);
                for (let i = 1; i < list.length; ++i) {
                    const [a, b] = getYears(list[i]);
                    if (a !== -1 && (minYear === -1 || a < minYear)) minYear = a;
                    if (b !== -1 && (maxYear === -1 || b > maxYear)) maxYear = b;
                }
                if (minYear === -1) minYear = maxYear;
                if (maxYear !== -1) {
                    result += ` & others ${minYear}-${maxYear}`;
                }
            }
        }
        return result;
    }
}
