import { GoogleTms } from '@basemaps/geo';
import maplibre, { RasterLayerSpecification } from 'maplibre-gl';
import { Component, ReactNode } from 'react';
import { MapAttribution } from '../attribution.js';
import { Config } from '../config.js';
import { MapConfig } from '../config.map.js';
import { getTileGrid, locationTransform } from '../tile.matrix.js';
import { MapOptionType, WindowUrl } from '../url.js';
import { DateRange } from './daterange.js';
import { Debug } from './debug.js';
import { MapSwitcher } from './map.switcher.js';

/**
 * Map loading in maplibre is weird, the on('load') event is different to 'loaded'
 * this function waits until the map.loaded() function is true before being run.
 */
export function onMapLoaded(map: maplibregl.Map, cb: () => void): void {
  if (map.loaded()) return cb();
  setTimeout(() => onMapLoaded(map, cb), 100);
}

export class Basemaps extends Component<unknown, { isLayerSwitcherEnabled: boolean }> {
  map: maplibregl.Map;
  el: HTMLElement;
  mapAttr: MapAttribution;
  /** Ignore the location updates */
  ignoreNextLocationUpdate = false;

  controlGeo: maplibregl.GeolocateControl | null;

  updateLocation = (): void => {
    if (this.ignoreNextLocationUpdate) {
      this.ignoreNextLocationUpdate = false;
      return;
    }
    const location = Config.map.location;
    this.map.setZoom(location.zoom);
    this.map.setCenter([location.lon, location.lat]);
  };

  updateBounds = (bounds: maplibregl.LngLatBoundsLike): void => {
    if (Config.map.tileMatrix !== GoogleTms) {
      // Transform bounds to current tileMatrix
      const lngLatBounds: maplibregl.LngLatBounds = maplibre.LngLatBounds.convert(bounds);
      const upperLeft = lngLatBounds.getNorthEast();
      const lowerRight = lngLatBounds.getSouthWest();
      const zoom = this.map.getZoom();
      const upperLeftLocation = locationTransform(
        { lat: upperLeft.lat, lon: upperLeft.lng, zoom },
        Config.map.tileMatrix,
        GoogleTms,
      );
      const lowerRightLocation = locationTransform(
        { lat: lowerRight.lat, lon: lowerRight.lng, zoom },
        Config.map.tileMatrix,
        GoogleTms,
      );
      bounds = [
        [upperLeftLocation.lon, upperLeftLocation.lat],
        [lowerRightLocation.lon, lowerRightLocation.lat],
      ];
    }
    this.map.fitBounds(bounds);
  };

  /**
   * Only show the geocontrol on GoogleTMS
   * As it does not work with the projection logic we are currently using
   */
  ensureGeoControl(): void {
    if (Config.map.debug['debug.screenshot']) return;
    if (Config.map.tileMatrix === GoogleTms) {
      if (this.controlGeo != null) return;
      this.controlGeo = new maplibre.GeolocateControl({});
      this.map.addControl(this.controlGeo, 'top-left');
    } else {
      if (this.controlGeo == null) return;
      this.map.removeControl(this.controlGeo);
    }
  }

  updateStyle = (): void => {
    this.ensureGeoControl();
    const tileGrid = getTileGrid(Config.map.tileMatrix.identifier);
    const style = tileGrid.getStyle(Config.map.layerId, Config.map.style, undefined, Config.map.filter.date);
    this.map.setStyle(style);

    if (Config.map.tileMatrix !== GoogleTms) this.map.setMaxBounds([-180, -85.06, 180, 85.06]);
    else this.map.setMaxBounds();
    // TODO check and only update when Config.map.layer changes.
    this.forceUpdate();
  };

  updateVisibleLayers = (newLayers: string): void => {
    if (!Config.map.visibleLayers) Config.map.visibleLayers = newLayers;
    if (newLayers !== Config.map.visibleLayers) {
      Config.map.visibleLayers = newLayers;
      const newStyleId =
        `${Config.map.styleId}` +
        `_after=${Config.map.filter.date.after?.slice(0, 4)}` +
        `&before=${Config.map.filter.date.before?.slice(0, 4)}`;
      if (this.map.getSource(newStyleId) == null) {
        this.map.addSource(newStyleId, {
          type: 'raster',
          tiles: [
            WindowUrl.toTileUrl({
              urlType: MapOptionType.TileRaster,
              tileMatrix: Config.map.tileMatrix,
              layerId: Config.map.layerId,
              config: Config.map.config,
              date: Config.map.filter.date,
            }),
          ],
          tileSize: 256,
        });
        this.map.addLayer({
          id: newStyleId,
          type: 'raster',
          source: newStyleId,
          paint: { 'raster-opacity': 0 },
        });
        this.map.moveLayer(newStyleId);

        let startTime: number;
        let previousTime: number;
        let isDone = false;
        const fadeTime = 1000;
        const endOpacity = 1;
        const rate = endOpacity / fadeTime;

        const stepAnimation = (nowTime: number): void => {
          if (startTime === undefined) startTime = nowTime;
          const elapsed = nowTime - startTime;
          if (previousTime !== nowTime) {
            const opacity = Math.min(rate * elapsed, endOpacity);
            this.map.setPaintProperty(newStyleId, 'raster-opacity', opacity);
            if (opacity === endOpacity) isDone = true;
          }
          if (elapsed < fadeTime) {
            previousTime = nowTime;
            if (!isDone) window.requestAnimationFrame(stepAnimation);
          }
        };

        window.requestAnimationFrame(stepAnimation);
      }
    }
  };

  removeOldLayers = (): void => {
    const filteredLayers = this.map
      .getStyle()
      .layers.filter((layer) => layer.id.startsWith(Config.map.styleId)) as RasterLayerSpecification[];
    // The last item in the array is the top layer, we pop that to ensure it isn't removed
    filteredLayers.pop();
    for (const layer of filteredLayers) {
      this.map.removeLayer(layer.id);
      this.map.removeSource(layer.source);
    }
  };

  componentDidMount(): void {
    // Force the URL to be read before loading the map
    Config.map.updateFromUrl();
    this.el = document.getElementById('map') as HTMLDivElement;

    if (this.el == null) throw new Error('Unable to find #map element');
    const cfg = Config.map;
    const tileGrid = getTileGrid(cfg.tileMatrix.identifier);
    const style = tileGrid.getStyle(cfg.layerId, cfg.style);
    const location = locationTransform(cfg.location, cfg.tileMatrix, GoogleTms);

    this.map = new maplibre.Map({
      container: this.el,
      style,
      center: [location.lon, location.lat], // starting position [lon, lat]
      zoom: location.zoom, // starting zoom
      attributionControl: false,
    });

    this.mapAttr = new MapAttribution(this.map);

    if (Config.map.debug['debug.screenshot'] !== true) {
      const nav = new maplibre.NavigationControl({ visualizePitch: true });
      this.map.addControl(nav, 'top-left');
      if (!Config.map.isDebug) this.map.addControl(new maplibre.FullscreenControl({ container: this.el }));
    }

    this.map.on('render', this.onRender);
    this.map.on('idle', this.removeOldLayers);
    onMapLoaded(this.map, () => {
      this._events.push(
        Config.map.on('location', this.updateLocation),
        Config.map.on('tileMatrix', this.updateStyle),
        Config.map.on('layer', this.updateStyle),
        Config.map.on('bounds', this.updateBounds),
        Config.map.on('visibleLayers', this.updateVisibleLayers),
      );

      this.updateStyle();
      // Need to ensure the debug layer has access to the map
      this.forceUpdate();
    });
  }

  _events: (() => boolean)[] = [];

  componentWillUnmount(): void {
    if (this.map) this.map.remove();
    for (const unbind of this._events) unbind();
    this._events = [];
  }

  render(): ReactNode {
    const isLayerSwitcherEnabled = Config.map.tileMatrix === GoogleTms && !Config.map.isDebug;
    return (
      <div style={{ flex: 1, position: 'relative' }}>
        <div id="map" style={{ width: '100%', height: '100%' }} />
        {Config.map.isDebug ? <Debug map={this.map} /> : undefined}
        {Config.map.isDebug && !Config.map.debug['debug.screenshot'] ? <DateRange /> : undefined}
        {isLayerSwitcherEnabled ? <MapSwitcher /> : undefined}
      </div>
    );
  }

  updateUrlTimer: unknown | null = null;
  onRender = (): void => {
    if (this.updateUrlTimer != null) return;
    this.updateUrlTimer = setTimeout(() => this.setLocationUrl(), 1000);
  };

  /** Update the window.location with the current location information */
  setLocationUrl(): void {
    this.updateUrlTimer = null;
    const location = Config.map.getLocation(this.map);

    this.ignoreNextLocationUpdate = true;
    Config.map.setLocation(location);

    const path = WindowUrl.toHash(location);
    window.history.replaceState(null, '', path);
  }
}
