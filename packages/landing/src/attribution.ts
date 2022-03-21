import { Attribution } from '@basemaps/attribution';
import { AttributionBounds } from '@basemaps/attribution/build/attribution';
import { AttributionCollection, GoogleTms, Stac, TileMatrixSet } from '@basemaps/geo';
import { BBox } from '@linzjs/geojson';
import maplibre, { LngLatBounds } from 'maplibre-gl';
import { Config } from './config.js';
import { locationTransform } from './tile.matrix.js';
import { MapOptionType } from './url.js';

const Copyright = `© ${Stac.License} LINZ`;

/** Cache the loading of attribution */
const Attributions: Map<string, Promise<Attribution | null>> = new Map();
/** Rendering process needs synch access */
const AttributionSync: Map<string, Attribution> = new Map();

/**
 * Handles displaying attributions for the OpenLayers interface
 */
export class MapAttribution {
  map: maplibre.Map;

  /** handle for scheduleRender setTimeout */
  private _scheduled: number | NodeJS.Timeout | undefined;
  /** handle for scheduleRender requestAnimationFrame */
  private _raf = 0;

  attributionHtml = '';
  bounds: LngLatBounds = new LngLatBounds([0, 0, 0, 0]);
  zoom = -1;
  filteredRecords: AttributionCollection[] = [];
  attributionControl?: maplibre.AttributionControl | null;

  constructor(map: maplibre.Map) {
    this.map = map;
    map.on('load', this.resetAttribution);
    map.on('move', this.updateAttribution);
    Config.map.on('tileMatrix', this.resetAttribution);
    Config.map.on('layer', this.resetAttribution);
  }

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

    const tmsId = Config.map.layerKeyTms;
    let loader = Attributions.get(tmsId);
    if (loader == null) {
      loader = Attribution.load(Config.map.toTileUrl(MapOptionType.Attribution)).catch(() => null);
      Attributions.set(tmsId, loader);

      loader.then((attr) => {
        if (attr == null) return;
        attr.isIgnored = this.isIgnored;
        AttributionSync.set(tmsId, attr);
        this.scheduleRender();
      });
    }
    this.scheduleRender();
  };

  // Ignore DEMS from the attribution list
  isIgnored = (attr: AttributionBounds): boolean => {
    return attr.collection.title.toLowerCase().startsWith('geographx');
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
    const attr = AttributionSync.get(Config.map.layerKeyTms);
    if (attr == null) return this.removeAttribution();
    this.zoom = Math.round(this.map.getZoom() ?? 0);
    this.bounds = this.map.getBounds();

    // Note that Mapbox rendering 512×512 image tiles are offset by one zoom level compared to 256×256 tiles.
    // For example, 512×512 tiles at zoom level 4 are equivalent to 256×256 tiles at zoom level 5.
    this.zoom += 1;

    const bbox = this.mapboxBoundToBbox(this.bounds, Config.map.tileMatrix);
    const filtered = attr.filter(bbox, this.zoom);
    let attributionHTML = attr.renderList(filtered);
    if (attributionHTML === '') {
      attributionHTML = Copyright;
    } else {
      attributionHTML = Copyright + ' - ' + attributionHTML;
    }
    if (attributionHTML !== this.attributionHtml) {
      const customAttribution = (this.attributionHtml = attributionHTML);
      this.removeAttribution();
      this.attributionControl = new maplibre.AttributionControl({ compact: false, customAttribution });
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
    const swCoord = locationTransform(swLocation, GoogleTms, tileMatrix);
    const neCoord = locationTransform(neLocation, GoogleTms, tileMatrix);
    const bbox: BBox = [swCoord.lon, swCoord.lat, neCoord.lon, neCoord.lat];
    return bbox;
  }

  /**
   * Add attribution for vector map
   */
  vectorAttribution(): void {
    this.removeAttribution();
    this.attributionControl = new maplibre.AttributionControl({ compact: false });
    this.map.addControl(this.attributionControl, 'bottom-right');
  }
}
