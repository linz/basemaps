import maplibre from 'maplibre-gl';
import { Component, ReactNode } from 'react';

import { Config, GaEvent, gaEvent } from '../config.js';
import { MapConfig } from '../config.map.js';
import { getTileGridStyle } from '../tile.matrix.js';
import { onMapLoaded } from './map.js';

export class MapSwitcher extends Component {
  _events: (() => boolean)[] = [];
  map!: maplibregl.Map;
  el!: HTMLDivElement;
  currentStyle!: string;

  override componentDidMount(): void {
    // Force the URL to be read before loading the map
    Config.map.updateFromUrl();
    this.el = document.getElementById('map-switcher-map') as HTMLDivElement;

    if (this.el == null) return;
    const cfg = Config.map;

    const target = this.getStyleType();
    this.currentStyle = `${target.layerId}::${target.style}`;

    const style = getTileGridStyle(cfg.tileMatrix, { layerId: target.layerId, style: target.style });
    const location = cfg.transformedLocation;

    this.map = new maplibre.Map({
      container: this.el,
      style,
      center: [location.lon, location.lat], // starting position [lon, lat]
      zoom: location.zoom, // starting zoom
      bearing: cfg.location.bearing ?? 0,
      pitch: cfg.location.pitch ?? 0,
      attributionControl: false,
    });

    onMapLoaded(this.map, () => {
      this._events.push(
        Config.map.on('location', this.update),
        Config.map.on('tileMatrix', this.update),
        Config.map.on('layer', this.update),
        Config.map.on('bounds', this.update),
      );
      this.updateMap();
    });
  }

  override componentWillUnmount(): void {
    if (this.map) this.map.remove();
    for (const e of this._events) e();
  }

  getStyleType(): { layerId: string; style?: string } {
    if (Config.map.layerId === 'aerial') {
      return { layerId: 'topographic', style: 'topographic' };
    } else if (Config.map.layerId === 'topographic' && Config.map.style === 'topographic') {
      return { layerId: 'topo-raster' };
    } else if (Config.map.layerId === 'topo-raster') {
      return { layerId: 'topographic', style: 'topolite' };
    } else if (Config.map.layerId === 'topographic' && Config.map.style === 'topolite') {
      return { layerId: 'hillshade-igor' };
    } else if (Config.map.layerId === 'hillshade-igor') {
      return { layerId: 'hillshade-igor-dsm' };
    } else {
      return { layerId: 'aerial' };
    }
  }

  _updateTimer: NodeJS.Timer | null = null;
  update = (): void => {
    if (this._updateTimer != null) return;
    this._updateTimer = setTimeout(this.updateMap, 1_000);
  };

  updateMap = (): void => {
    this._updateTimer = null;
    const location = Config.map.transformedLocation;
    const target = this.getStyleType();
    const styleId = `${target.layerId}::${target.style}`;
    if (this.currentStyle !== styleId) {
      const style = getTileGridStyle(Config.map.tileMatrix, { layerId: target.layerId, style: target.style });
      this.currentStyle = styleId;
      this.map.setStyle(style);
    }

    this.map.setZoom(Math.max(location.zoom - 4, 0));
    this.map.setCenter([location.lon, location.lat]);
    this.map.setBearing(Config.map.location.bearing ?? 0);
    this.map.setPitch(Config.map.location.pitch ?? 0);
    this.forceUpdate();
  };

  switchLayer = (): void => {
    // Both a click event and layer switch even will be fired from this action
    gaEvent(GaEvent.Ui, 'map-switcher:click');

    const target = this.getStyleType();
    Config.map.setLayerId(target.layerId, target.style);
    this.updateMap();
    window.history.pushState(null, '', `?${MapConfig.toUrl(Config.map)}`);
  };

  override render(): ReactNode {
    const layerTitle = `Switch map to ${this.getStyleType().layerId}`;
    return (
      <div id="map-switcher" className="map-switcher" onClick={this.switchLayer} title={layerTitle}>
        <div id="map-switcher-map" style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />
      </div>
    );
  }
}
