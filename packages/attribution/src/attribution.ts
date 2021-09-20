import { AttributionCollection, AttributionStac } from '@basemaps/geo';
import { BBox, intersection, MultiPolygon, Ring, Wgs84 } from '@linzjs/geojson';

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
  boundaries: Ring[][] = [];
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
  intersects(extent: BBox, zoom: number): boolean {
    if (zoom > this.maxZoom || zoom < this.minZoom) return false;
    if (!Wgs84.intersects(extent, this.bbox)) return false;
    return this.intersection(Wgs84.bboxToMultiPolygon(extent));
  }

  /**
   * Does this bounds intersect the supplied polygon
   * @param polygon The polygon to test for intersection against
   */
  intersection(polygon: MultiPolygon): boolean {
    for (const boundary of this.boundaries) {
      if (intersection(boundary, polygon).length > 0) return true;
    }
    return false;
  }

  /** Add a boundary ring definition to */
  addBoundary(ring: number[][][]): void {
    /**
     * Fix weirdness in types, GeoJSON defines a point as `number[]` where as
     * polygon clipping uses [number,number]
     */
    assertRing(ring);
    this.boundaries.push(ring);
  }
}

/** Assert the ring is a lat,lng pair  */
function assertRing(ring: number[][][]): asserts ring is Ring[] {
  for (const outer of ring) {
    for (const inner of outer) {
      if (inner.length !== 2) throw new Error('Invalid ring wrong length');
      // TODO some attribution is outside of lat/lng bounds BM-113
      // if (inner[0] < -180 || inner[0] > 180) throw new Error('Invalid ring outside of bounds');
      // if (inner[1] < -90 || inner[1] > 90) throw new Error('Invalid ring outside of bounds');
    }
  }
}

/** Build an Array of AttributionBounds from AttributionStac */
function convertToBounds(stac: AttributionStac): AttributionBounds[] {
  const colMap = new Map<string, AttributionBounds>();
  const result: AttributionBounds[] = [];

  for (const collection of stac.collections) {
    const attr = new AttributionBounds(collection);
    result.push(attr);
    colMap.set(collection.id, attr);
  }

  for (const f of stac.features) {
    const col = colMap.get(f.collection ?? '');
    if (col == null) throw new Error('Could not match feature to collection: ' + f.collection);

    if (f.geometry.type === 'Polygon') {
      col.addBoundary(f.geometry.coordinates);
    } else if (f.geometry.type === 'MultiPolygon') {
      for (const poly of f.geometry.coordinates) col.addBoundary(poly);
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
  attributions: AttributionBounds[];

  constructor(attributions: AttributionBounds[]) {
    this.attributions = attributions;
  }

  /**
     * Fetch the AttributionStac from server and load into `attributions`

     * @param url the location of the AttributionStac file
     */
  static async load(url: string): Promise<Attribution> {
    const resp = await fetch(url);
    if (resp.ok) {
      const attributionStac = await resp.json();
      return Attribution.fromStac(attributionStac);
    }

    throw new Error(`fetch attribution failed [${resp.status}] ${resp.statusText}`);
  }

  static fromStac(json: AttributionStac): Attribution {
    return new Attribution(convertToBounds(json).reverse());
  }

  /**
     * Filter the attributions to just those that intersect with `extent` and `zoom`

     * @param extent a bounding box in the projection supplied to the constructor
     * @param zoom the zoom level the extent is viewed at
     */
  filter(extent: BBox, zoom: number): AttributionCollection[] {
    zoom = Math.round(zoom);

    const filtered: AttributionCollection[] = [];
    const { attributions } = this;
    if (attributions == null) return filtered;
    for (const attr of attributions) {
      if (attr.intersects(extent, zoom)) filtered.push(attr.collection);
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
