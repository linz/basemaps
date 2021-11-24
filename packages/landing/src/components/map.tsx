import { GoogleTms } from '@basemaps/geo';
import maplibre from 'maplibre-gl';
import { Component, ComponentChild } from 'preact';
import { MapAttribution } from '../attribution.js';
import { Config } from '../config.js';
import { getTileGrid } from '../tile.matrix.js';
import { MapLocation, WindowUrl } from '../url.js';

export class Basemaps extends Component {
  map: maplibre.Map;
  el: HTMLElement;
  mapAttr: MapAttribution;

  updateLocation = (): void => {
    const location = Config.map.location;
    this.map.setZoom(location.zoom);
    this.map.setCenter([location.lon, location.lat]);
  };

  updateBounds = (bounds: maplibre.LngLatBoundsLike): void => {
    this.map.fitBounds(bounds);
  };

  updateStyle = (): void => {
    const tileGrid = getTileGrid(Config.map.tileMatrix.identifier);
    const style = tileGrid.getStyle(Config.map);
    this.map.setStyle(style);

    if (Config.map.tileMatrix !== GoogleTms) this.map.setMaxBounds([-180, -85.06, 180, 85.06]);
    else this.map.setMaxBounds();
  };

  componentDidMount(): void {
    this.el = document.getElementById('map') as HTMLDivElement;
    console.log('Mounted');

    if (this.el == null) throw new Error('Unable to find #map element');
    const cfg = Config.map;
    const tileGrid = getTileGrid(cfg.tileMatrix.identifier);
    const style = tileGrid.getStyle(cfg);
    const location = cfg.transformedLocation;

    this.map = new maplibre.Map({
      container: 'map',
      style,
      center: [location.lon, location.lat], // starting position [lon, lat]
      zoom: location.zoom, // starting zoom
      attributionControl: false,
    });

    this.mapAttr = new MapAttribution(this.map);

    const nav = new maplibre.NavigationControl({ visualizePitch: true });
    this.map.addControl(nav, 'top-left');
    this.map.on('render', this.onRender);
    this.map.on('load', () => {
      console.log('Loaded');
      this._events.push(
        Config.map.on('location', this.updateLocation),
        Config.map.on('tileMatrix', this.updateStyle),
        Config.map.on('layer', this.updateStyle),
        Config.map.on('bounds', this.updateBounds),
      );

      this.updateStyle();
    });
  }

  _events: (() => boolean)[] = [];

  componentWillUnmount(): void {
    if (this.map) this.map.remove();
    for (const unbind of this._events) unbind();
    this._events = [];
  }

  render(): ComponentChild {
    return <div style={{ flex: 1 }} id="map"></div>;
  }

  updateUrlTimer: unknown | null = null;
  onRender = (): void => {
    if (this.updateUrlTimer != null) return;
    this.updateUrlTimer = setTimeout(() => this.setLocationUrl(), 1000);
  };

  getLocation(): MapLocation {
    const center = this.map.getCenter();
    if (center == null) throw new Error('Invalid Map location');
    const zoom = Math.floor((this.map.getZoom() ?? 0) * 10e3) / 10e3;
    return Config.map.transformLocation(center.lat, center.lng, zoom);
  }

  /** Update the window.location with the current location information */
  setLocationUrl(): void {
    this.updateUrlTimer = null;
    const path = WindowUrl.toHash(this.getLocation());
    window.history.replaceState(null, '', path);
  }
}
