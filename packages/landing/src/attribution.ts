import { Attribution } from '@basemaps/attribution';
import { AttributionBounds } from '@basemaps/attribution/build/attribution.js';
import { GoogleTms, Stac } from '@basemaps/geo';
import * as maplibre from 'maplibre-gl';

import { onMapLoaded } from './components/map.js';
import { Config } from './config.js';
import { mapToBoundingBox } from './tile.matrix.js';
import { MapOptionType } from './url.js';

const Copyright = `© ${Stac.License} LINZ`;

export class MapAttributionState {
  /** Cache the loading of attribution */
  attrs: Map<string, Promise<Attribution | null>> = new Map();
  /** Rendering process needs sync access */
  attrsSync: Map<string, Attribution> = new Map();

  private getLayer(layerKey: string, url: string): Promise<Attribution | null> {
    const layer = this.attrs.get(layerKey);
    if (layer != null) return layer;
    const loader = Attribution.load(url)
      .catch(() => null)
      .then((ret) => {
        if (ret == null) {
          this.attrs.delete(layerKey);
          this.attrsSync.delete(layerKey);
        } else {
          this.attrsSync.set(layerKey, ret);
        }
        return ret;
      });
    this.attrs.set(layerKey, loader);
    return loader;
  }

  /**
   * Load the attribution fo all layers
   * @returns
   */
  getAll(): Promise<Attribution | null> {
    return this.getLayer('all', Config.map.toTileUrl(MapOptionType.Attribution, GoogleTms, 'all', null));
  }

  /** Load a attribution from a url, return a cached copy if we have one */
  getCurrentAttribution(): Promise<Attribution | null> {
    return this.getLayer(Config.map.layerKeyTms, Config.map.toTileUrl(MapOptionType.Attribution)).then((ret) => {
      if (ret != null) ret.isIgnored = this.isIgnored;
      return ret;
    });
  }

  /** Filter the attribution to the map bounding box */
  filterAttributionToMap(attr: Attribution, map: maplibregl.Map): AttributionBounds[] {
    let zoom = Math.round(map.getZoom() ?? 0);
    // Note that Mapbox rendering 512×512 image tiles are offset by one zoom level compared to 256×256 tiles.
    // For example, 512×512 tiles at zoom level 4 are equivalent to 256×256 tiles at zoom level 5.
    zoom += 1;
    const extent = mapToBoundingBox(map, zoom, Config.map.tileMatrix);
    return attr.filter({ extent, zoom });
  }

  // Ignore DEMS from the attribution list
  isIgnored = (attr: AttributionBounds): boolean => {
    const title = attr.collection.title.toLowerCase();
    return title.startsWith('geographx') || title.includes(' dem ');
  };
}

export const MapAttrState = new MapAttributionState();

/**
 * Handles displaying attributions for the OpenLayers interface
 */
export class MapAttribution implements maplibre.IControl {
  /** handle for scheduleRender setTimeout */
  private _scheduled: number | NodeJS.Timeout | undefined;
  /** handle for scheduleRender requestAnimationFrame */
  private _raf = 0;
  bounds: maplibre.LngLatBounds = new maplibre.LngLatBounds([0, 0, 0, 0]);
  zoom = -1;

  attrHtml: HTMLDivElement;
  attrContainer: HTMLDivElement;

  map?: maplibre.Map;

  constructor() {
    this.attrContainer = document.createElement('div');
    this.attrContainer.className = 'maplibregl-ctrl maplibregl-ctrl-attrib';
    this.attrHtml = document.createElement('div');
    this.attrHtml.className = `maplibregl-ctrl-attrib-inner mapboxgl-ctrl-attrib-inner`;
    this.attrContainer.appendChild(this.attrHtml);
  }

  onAdd(map: maplibre.Map): HTMLElement {
    this.map = map;
    map.on('move', this.updateAttribution);
    onMapLoaded(map, () => {
      this._events.push(Config.map.on('filter', this.updateAttribution));
      this.resetAttribution();
    });

    this._events.push(Config.map.on('tileMatrix', this.resetAttribution));
    this._events.push(Config.map.on('layer', this.resetAttribution));
    return this.attrContainer;
  }

  onRemove(map: maplibre.Map): void {
    for (const evt of this._events) evt();
    this._events = [];
    map.off('move', this.updateAttribution);
  }

  _events: (() => boolean)[] = [];

  /**
   * Trigger an attribution text update.
   */
  resetAttribution = (): void => {
    this.updateAttribution();
  };

  /**
   * Trigger an attribution text update, will not update if the attribution text not change.
   * Will fetch attributions if needed
   */
  updateAttribution = (): void => {
    if (this.map == null) return;
    if (Config.map.isVector) {
      for (const source of Object.values(this.map.style.sourceCaches)) {
        const attr = source.getSource().attribution;
        if (attr) return this.setAttribution(attr);
      }
      return this.setAttribution('© Toitū Te Whenua');
    }
    const loader = MapAttrState.getCurrentAttribution();
    void loader.then(() => this.scheduleRender());
  };

  /**
   * Only update attributions at most every 200ms
   */
  private scheduleRender(): void {
    if (this.map == null) return;
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
    if (this.map == null) return;
    this._raf = 0;
    const attr = MapAttrState.attrsSync.get(Config.map.layerKeyTms);
    if (attr == null) return this.setAttribution('');
    const filtered = MapAttrState.filterAttributionToMap(attr, this.map);
    const filteredLayerIds = filtered.map((x) => x.collection.id).join('_');
    Config.map.emit('visibleLayers', filteredLayerIds);

    let attributionHTML = attr.renderList(filtered);
    if (attributionHTML === '') {
      attributionHTML = Copyright;
    } else {
      attributionHTML = Copyright + ' - ' + attributionHTML;
    }

    this.setAttribution(attributionHTML);
  };

  setAttribution(text: string): void {
    this.attrHtml.innerText = text;
  }
}
