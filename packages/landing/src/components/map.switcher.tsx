import maplibre from 'maplibre-gl';
import { Component, ComponentChild } from 'preact';
import { Config } from '../config.js';
import { MapConfig } from '../config.map.js';
import { getTileGrid } from '../tile.matrix.js';

export class MapSwitcher extends Component {
  _events: (() => boolean)[] = [];
  map: maplibre.Map;
  el: HTMLDivElement;
  currentStyle: string;

  componentDidMount(): void {
    // Force the URL to be read before loading the map
    Config.map.updateFromUrl();
    this.el = document.getElementById('map-switcher-map') as HTMLDivElement;

    if (this.el == null) return;
    const cfg = Config.map;
    const tileGrid = getTileGrid(cfg.tileMatrix.identifier);

    const target = this.getStyleType();
    this.currentStyle = `${target.layerId}::${target.style}`;

    const style = tileGrid.getStyle(target.layerId, target.style);
    const location = cfg.transformedLocation;

    this.map = new maplibre.Map({
      container: this.el,
      style,
      center: [location.lon, location.lat], // starting position [lon, lat]
      zoom: location.zoom, // starting zoom
      attributionControl: false,
    });

    this.map.on('load', () => {
      this._events.push(
        Config.map.on('location', this.update),
        Config.map.on('tileMatrix', this.update),
        Config.map.on('layer', this.update),
        Config.map.on('bounds', this.update),
      );
      this.updateMap();
    });
  }

  componentWillUnmount(): void {
    if (this.map) this.map.remove();
    for (const e of this._events) e();
  }

  getStyleType(): { layerId: string; style?: string } {
    if (Config.map.layerId !== 'aerial') return { layerId: 'aerial' };
    return { layerId: 'topographic', style: 'topographic' };
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
      const tileGrid = getTileGrid(Config.map.tileMatrix.identifier);
      const style = tileGrid.getStyle(target.layerId, target.style);
      this.currentStyle = styleId;
      this.map.setStyle(style);
    }

    this.map.setZoom(Math.max(location.zoom - 4, 0));
    this.map.setCenter([location.lon, location.lat]);
    this.setState(this.state);
  };

  switchLayer = (): void => {
    const target = this.getStyleType();
    Config.map.setLayerId(target.layerId, target.style);
    this.updateMap();
    window.history.pushState(null, '', `?${MapConfig.toUrl(Config.map)}`);
  };

  render(): ComponentChild {
    const layerTitle = `Switch map to ${this.getStyleType().layerId}`;
    return (
      <div id="map-switcher" class="map-switcher" onClick={this.switchLayer} title={layerTitle}>
        <div id="map-switcher-map" style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />
      </div>
    );
  }
}
