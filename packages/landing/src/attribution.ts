import { Attribution, AttributionBounds } from '@basemaps/attribution';
import { GoogleTms, Stac, TileMatrixSet } from '@basemaps/geo';
import { BBox } from '@linzjs/geojson';
import maplibre, { LngLatBounds } from 'maplibre-gl';
import { onMapLoaded } from './components/map.js';
import { Config } from './config.js';
import { locationTransform } from './tile.matrix.js';
import { MapOptionType } from './url.js';

const Copyright = `© ${Stac.License} LINZ`;

export class MapAttributionState {
  /** Cache the loading of attribution */
  _attrs: Map<string, Promise<Attribution | null>> = new Map();
  /** Rendering process needs synch access */
  _attrsSync: Map<string, Attribution> = new Map();

  /** Load a attribution from a url, return a cached copy if we have one */
  getCurrentAttribution(): Promise<Attribution | null> {
    const cacheKey = Config.map.layerKeyTms;
    let attrs = this._attrs.get(cacheKey);
    if (attrs == null) {
      attrs = Attribution.load(Config.map.toTileUrl(MapOptionType.Attribution)).catch(() => null);
      this._attrs.set(cacheKey, attrs);
    }
    return attrs;
  }

  getCurrentAttributionSync(): Attribution | undefined {
    const cacheKey = Config.map.layerKeyTms;
    const attrSync = this._attrsSync.get(cacheKey);
    if (attrSync) return attrSync;
    const attrAsync = this.getCurrentAttribution();
    attrAsync.then((a) => {
      if (a == null) return;
      this._attrsSync.set(Config.map.layerKeyTms, a); // Question? Can we get the resolved promises out from here?
    });
    return this._attrsSync.get(cacheKey);
  }

  /** Filter the attribution to the map bounding box */
  filterAttributionToMap(attr: Attribution, map: maplibregl.Map): AttributionBounds[] {
    let zoom = Math.round(map.getZoom() ?? 0);
    // Note that Mapbox rendering 512×512 image tiles are offset by one zoom level compared to 256×256 tiles.
    // For example, 512×512 tiles at zoom level 4 are equivalent to 256×256 tiles at zoom level 5.
    zoom += 1;
    const extent = MapAttributionState.mapboxBoundToBbox(map.getBounds(), zoom, Config.map.tileMatrix);
    return attr.filter({
      extent,
      zoom: zoom,
      dateAfter: Config.map.filter.date.after,
      dateBefore: Config.map.filter.date.before,
    });
  }

  /**
   * Covert Mapbox Bounds to tileMatrix BBox
   */
  static mapboxBoundToBbox(bounds: LngLatBounds, zoom: number, tileMatrix: TileMatrixSet): BBox {
    const swLocation = { lon: bounds.getWest(), lat: bounds.getSouth(), zoom: zoom };
    const neLocation = { lon: bounds.getEast(), lat: bounds.getNorth(), zoom: zoom };
    const swCoord = locationTransform(swLocation, GoogleTms, tileMatrix);
    const neCoord = locationTransform(neLocation, GoogleTms, tileMatrix);
    const bbox: BBox = [swCoord.lon, swCoord.lat, neCoord.lon, neCoord.lat];
    return bbox;
  }
}

export const MapAttrState = new MapAttributionState();

/**
 * Handles displaying attributions for the OpenLayers interface
 */
export class MapAttribution {
  map: maplibregl.Map;

  /** handle for scheduleRender setTimeout */
  private _scheduled: number | NodeJS.Timeout | undefined;
  /** handle for scheduleRender requestAnimationFrame */
  private _raf = 0;

  attributionHtml = '';
  bounds: LngLatBounds = new LngLatBounds([0, 0, 0, 0]);
  zoom = -1;
  attributionControl?: maplibregl.AttributionControl | null;

  constructor(map: maplibregl.Map) {
    this.map = map;
    map.on('move', this.updateAttribution);
    Config.map.on('tileMatrix', this.resetAttribution);
    Config.map.on('layer', this.resetAttribution);

    onMapLoaded(this.map, () => {
      this._events.push(Config.map.on('filter', this.updateAttribution));
      this.resetAttribution();
    });
  }

  _events: (() => boolean)[] = [];

  /**
   * Trigger an attribution text update.
   */
  resetAttribution = (): void => {
    this.attributionHtml = '';
    this.updateAttribution();
  };

  /**
   * Trigger an attribution text update, will not update if the attribution text not change.
   * Will fetch attributions if needed
   */
  updateAttribution = (): void => {
    // Vector layers currently have no attribution
    if (Config.map.isVector) return this.vectorAttribution();
    this.scheduleRender();
  };

  // Ignore DEMS from the attribution list
  isIgnored = (attr: AttributionBounds): boolean => {
    const title = attr.collection.title.toLowerCase();
    return title.startsWith('geographx') || title.includes(' dem ');
  };

  /**
   * Only update attributions at most every 200ms
   */
  private scheduleRender(): void {
    if (this._scheduled != null || this._raf !== 0) return;
    if (this.map.getZoom() === this.zoom) {
      const bounds = this.map.getBounds();
      if (bounds === this.bounds) return;
    }
    this.zoom = this.map.getZoom() ?? 0;
    this.bounds = this.map.getBounds();
    this._scheduled = setTimeout(() => {
      this._scheduled = undefined;
      this._raf = requestAnimationFrame(this.renderAttribution);
    }, 200);
  }

  removeAttribution(): void {
    if (this.attributionControl == null) return;
    this.map.removeControl(this.attributionControl);
    this.attributionControl = null;
  }
  /**
   * Set the attribution text if needed
   */
  renderAttribution = (): void => {
    this._raf = 0;
    const attr = MapAttrState.getCurrentAttributionSync();
    if (attr == null) return this.removeAttribution();
    const filtered = MapAttrState.filterAttributionToMap(attr, this.map);
    const filteredLayerIds = filtered.map((x) => x.collection.id).join('_');
    Config.map.emit('visibleLayers', filteredLayerIds);

    let attributionHTML = attr.renderList(filtered);
    if (attributionHTML === '') {
      attributionHTML = Copyright;
    } else {
      attributionHTML = Copyright + ' - ' + attributionHTML;
    }
    if (attributionHTML !== this.attributionHtml) {
      this.attributionHtml = attributionHTML;
      this.removeAttribution();
      this.attributionControl = new maplibre.AttributionControl({ compact: false, customAttribution: attributionHTML });
      this.map.addControl(this.attributionControl, 'bottom-right');
    }
  };

  /**
   * Add attribution for vector map
   */
  vectorAttribution(): void {
    this.removeAttribution();
    this.attributionControl = new maplibre.AttributionControl({ compact: false });
    this.map.addControl(this.attributionControl, 'bottom-right');
  }
}
