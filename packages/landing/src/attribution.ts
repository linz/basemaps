import { Attribution } from '@basemaps/attribution';
import { AttributionCollection, Stac, TileMatrixSet } from '@basemaps/geo';
import { BBox } from '@linzjs/geojson';
import { MapOptions, MapOptionType, WindowUrl } from './url.js';
import mapboxgl, { LngLatBounds } from 'maplibre-gl';
import { locationTransform } from './tile.matrix.js';
import { MapboxTms } from './map.js';

const Copyright = `© ${Stac.License} LINZ`;

/**
 * Handles displaying attributions for the OpenLayers interface
 */
export class MapAttribution {
  map: mapboxgl.Map;
  config: MapOptions;

  /** handle for scheduleRender setTimeout */
  private _scheduled: number | NodeJS.Timeout | undefined;
  /** handle for scheduleRender requestAnimationFrame */
  private _raf = 0;

  attributions: Attribution | null = null;
  attributionHTML = '';
  bounds: LngLatBounds = new LngLatBounds([0, 0, 0, 0]);
  zoom = -1;
  filteredRecords: AttributionCollection[] = [];
  attributionControl: mapboxgl.AttributionControl;

  /**
   * Initialize monitoring the OpenLayers map and set the source attributions when changed.
   */
  static init(map: mapboxgl.Map, config: MapOptions): void {
    const attribution = new MapAttribution(map, config);

    map.on('load', () => attribution.updateAttribution());
    map.on('move', () => attribution.updateAttribution());
  }

  constructor(map: mapboxgl.Map, config: MapOptions) {
    this.map = map;
    this.config = config;
  }

  _attributionLoad: Promise<Attribution> | null;
  /**
   * Trigger an attribution text update. Will fetch attributions if needed
   */
  updateAttribution(): void {
    if (this._attributionLoad == null) {
      const customAttribution = (this.attributionHTML = 'Loading…');
      this.attributionControl = new mapboxgl.AttributionControl({ compact: false, customAttribution });
      this.map.addControl(this.attributionControl, 'bottom-right');
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

  /**
   * Set the attribution text if needed
   */
  renderAttribution = (): void => {
    this._raf = 0;
    if (this.attributions == null) return;
    this.zoom = Math.round(this.map.getZoom() ?? 0);
    this.bounds = this.map.getBounds();

    // Note that Mapbox rendering 512×512 image tiles are offset by one zoom level compared to 256×256 tiles.
    // For example, 512×512 tiles at zoom level 4 are equivalent to 256×256 tiles at zoom level 5.
    this.zoom += 1;

    const bbox = this.mapboxBoundToBbox(this.bounds, this.config.tileMatrix);
    const filtered = this.attributions.filter(bbox, this.zoom);
    let attributionHTML = this.attributions.renderList(filtered);
    if (attributionHTML === '') {
      attributionHTML = Copyright;
    } else {
      attributionHTML = Copyright + ' - ' + attributionHTML;
    }
    if (attributionHTML !== this.attributionHTML) {
      const customAttribution = (this.attributionHTML = attributionHTML);
      this.map.removeControl(this.attributionControl);
      this.attributionControl = new mapboxgl.AttributionControl({ compact: false, customAttribution });
      this.map.addControl(this.attributionControl, 'bottom-right');
    }

    this.filteredRecords = filtered;
  };

  /**
   * Covert Mapbox Bounds to tileMatrix BBox
   */
  mapboxBoundToBbox(bounds: LngLatBounds, tileMatrix: TileMatrixSet): BBox {
    const swLocation = { lon: bounds.getWest(), lat: bounds.getSouth(), zoom: this.zoom };
    const neLocation = { lon: bounds.getEast(), lat: bounds.getNorth(), zoom: this.zoom };
    const swCoord = locationTransform(swLocation, MapboxTms, tileMatrix);
    const neCoord = locationTransform(neLocation, MapboxTms, tileMatrix);
    const bbox: BBox = [swCoord.lon, swCoord.lat, neCoord.lon, neCoord.lat];
    return bbox;
  }
}
