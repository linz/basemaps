import { GoogleTms } from '@basemaps/geo';
import maplibre from 'maplibre-gl';
import { Component, ComponentChild } from 'preact';
import { MapAttribution } from '../attribution.js';
import { Config } from '../config.js';
import { SplitIo } from '../split.js';
import { getTileGrid, locationTransform } from '../tile.matrix.js';
import { MapLocation, WindowUrl } from '../url.js';
import { MapSwitcher } from './map.switcher.js';

export class Basemaps extends Component<unknown, { isLayerSwitcherEnabled: boolean }> {
  map: maplibre.Map;
  el: HTMLElement;
  mapAttr: MapAttribution;
  /** Ignore the location updates */
  ignoreNextLocationUpdate = false;

  updateLocation = (): void => {
    if (this.ignoreNextLocationUpdate) {
      this.ignoreNextLocationUpdate = false;
      return;
    }
    const location = Config.map.location;
    this.map.setZoom(location.zoom);
    this.map.setCenter([location.lon, location.lat]);
  };

  updateBounds = (bounds: maplibre.LngLatBoundsLike): void => {
    this.map.fitBounds(bounds);
  };

  updateStyle = (): void => {
    const tileGrid = getTileGrid(Config.map.tileMatrix.identifier);
    const style = tileGrid.getStyle(Config.map.layerId, Config.map.style);
    this.map.setStyle(style);

    if (Config.map.tileMatrix !== GoogleTms) this.map.setMaxBounds([-180, -85.06, 180, 85.06]);
    else this.map.setMaxBounds();
    this.setState(this.state);
  };

  componentWillMount(): void {
    this.setState({ isLayerSwitcherEnabled: false });
  }

  componentDidMount(): void {
    // Force the URL to be read before loading the map
    Config.map.updateFromUrl();
    this.el = document.getElementById('map') as HTMLDivElement;

    if (this.el == null) throw new Error('Unable to find #map element');
    const cfg = Config.map;
    const tileGrid = getTileGrid(cfg.tileMatrix.identifier);
    const style = tileGrid.getStyle(cfg.layerId, cfg.style);
    const location = locationTransform(cfg.location, Config.map.tileMatrix, GoogleTms);

    this.map = new maplibre.Map({
      container: this.el,
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
      this._events.push(
        Config.map.on('location', this.updateLocation),
        Config.map.on('tileMatrix', this.updateStyle),
        Config.map.on('layer', this.updateStyle),
        Config.map.on('bounds', this.updateBounds),
      );

      this.updateStyle();
    });

    SplitIo.getClient().then((f) => {
      const isEnabled = f?.getTreatment('layer-switcher-button') === 'on';
      this.setState({ isLayerSwitcherEnabled: isEnabled });
    });
  }

  _events: (() => boolean)[] = [];

  componentWillUnmount(): void {
    if (this.map) this.map.remove();
    for (const unbind of this._events) unbind();
    this._events = [];
  }

  render(): ComponentChild {
    const isLayerSwitcherEnabled = this.state.isLayerSwitcherEnabled && Config.map.tileMatrix === GoogleTms;
    return (
      <div style={{ flex: 1, position: 'relative' }}>
        <div id="map" style={{ width: '100%', height: '100%' }} />
        {isLayerSwitcherEnabled ? <MapSwitcher /> : undefined}
      </div>
    );
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
    const location = { lat: center.lat, lon: center.lng, zoom };
    Config.map.setLocation(location);
    return Config.map.transformedLocation;
  }

  /** Update the window.location with the current location information */
  setLocationUrl(): void {
    this.updateUrlTimer = null;
    const location = this.getLocation();

    this.ignoreNextLocationUpdate = true;

    const path = WindowUrl.toHash(location);
    window.history.replaceState(null, '', path);
  }
}
