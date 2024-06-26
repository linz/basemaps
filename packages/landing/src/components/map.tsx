import { GoogleTms, LocationUrl } from '@basemaps/geo';
import maplibre, { RasterLayerSpecification } from 'maplibre-gl';
import { Component, ReactNode } from 'react';

import { MapAttribution } from '../attribution.js';
import { Config } from '../config.js';
import { MapConfig } from '../config.map.js';
import { getTileGrid, locationTransform } from '../tile.matrix.js';
import { MapOptionType, WindowUrl } from '../url.js';
import { Debug } from './debug.js';
import { MapSwitcher } from './map.switcher.js';

const LayerFadeTime = 750;

/**
 * Map loading in maplibre is weird, the on('load') event is different to 'loaded'
 * this function waits until the map.loaded() function is true before being run.
 */
export function onMapLoaded(map: maplibregl.Map, cb: () => void): void {
  if (map.loaded()) return cb();
  setTimeout(() => onMapLoaded(map, cb), 100);
}

export class Basemaps extends Component<unknown, { isLayerSwitcherEnabled: boolean }> {
  map!: maplibregl.Map;
  el?: HTMLElement;
  mapAttr?: MapAttribution;

  /** Ignore the location updates */
  ignoreNextLocationUpdate = false;

  controlScale?: maplibre.ScaleControl | null;
  controlTerrain?: maplibre.TerrainControl | null;
  controlGeo?: maplibregl.GeolocateControl | null;

  updateLocation = (): void => {
    if (this.ignoreNextLocationUpdate) {
      this.ignoreNextLocationUpdate = false;
      return;
    }
    const location = Config.map.location;
    this.map.setZoom(location.zoom);
    this.map.setCenter([location.lon, location.lat]);
    if (location.bearing != null) this.map.setBearing(location.bearing);
    if (location.pitch != null) this.map.setPitch(location.pitch);
  };

  updateTerrainFromEvent = (): void => {
    const terrain = this.map.getTerrain();
    Config.map.setTerrain(terrain?.source ?? null);
    window.history.pushState(null, '', `?${MapConfig.toUrl(Config.map)}`);
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

  /**
   * Only show the elevation on GoogleTMS, as there is no data for other projections yet
   */
  ensureElevationControl(): void {
    if (Config.map.debug['debug.screenshot']) return;
    if (Config.map.isDebug) return;
    if (Config.map.tileMatrix === GoogleTms) {
      if (this.controlTerrain != null) return;
      // Try to find terrain source and add to the control
      for (const [key, source] of Object.entries(this.map.getStyle().sources)) {
        if (source.type === 'raster-dem') {
          this.controlTerrain = new maplibre.TerrainControl({
            source: key,
            exaggeration: 1.2,
          });
          this.map.addControl(this.controlTerrain, 'top-left');
          break;
        }
      }
    } else {
      if (this.controlTerrain == null) return;
      this.map.removeControl(this.controlTerrain);
      this.controlTerrain = null;
    }
  }

  /**
   * Only show the scale on GoogleTMS
   * As it does not work with the projection logic we are currently using
   */
  ensureScaleControl(): void {
    if (Config.map.debug['debug.screenshot']) return;
    if (Config.map.tileMatrix === GoogleTms) {
      if (this.controlScale != null) return;
      this.controlScale = new maplibre.ScaleControl({});
      this.map.addControl(this.controlScale, 'bottom-right');
    } else {
      if (this.controlScale == null) return;
      this.map.removeControl(this.controlScale);
      this.controlScale = null;
    }
  }

  updateStyle = (): void => {
    this.ensureGeoControl();
    this.ensureScaleControl();
    this.ensureElevationControl();
    const tileGrid = getTileGrid(Config.map.tileMatrix.identifier);
    const style = tileGrid.getStyle(Config.map.layerId, Config.map.style, undefined, Config.map.filter.date);
    this.map.setStyle(style);
    if (Config.map.tileMatrix !== GoogleTms) {
      this.map.setMaxBounds([-179.9, -85, 179.9, 85]);
    } else {
      this.map.setMaxBounds();
    }
    // TODO check and only update when Config.map.layer changes.
    this.forceUpdate();
  };

  updateVisibleLayers = (newLayers: string): void => {
    if (Config.map.visibleLayers == null) Config.map.visibleLayers = newLayers;
    if (newLayers !== Config.map.visibleLayers) {
      Config.map.visibleLayers = newLayers;
      const newStyleId = `${Config.map.styleId}` + `before=${Config.map.filter.date.before?.slice(0, 4)}`;
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
        this.map.moveLayer(newStyleId); // Move to front
        this.map.setPaintProperty(newStyleId, 'raster-opacity-transition', { duration: LayerFadeTime });
        this.map.setPaintProperty(newStyleId, 'raster-opacity', 1);
      }
    }
  };

  removeOldLayers = (): void => {
    const filteredLayers = this.map
      ?.getStyle()
      .layers.filter((layer) => layer.id.startsWith(Config.map.styleId)) as RasterLayerSpecification[];
    if (filteredLayers == null) return;
    // The last item in the array is the top layer, we pop that to ensure it isn't removed
    filteredLayers.pop();
    for (const layer of filteredLayers) {
      this.map.setPaintProperty(layer.id, 'raster-opacity-transition', { duration: LayerFadeTime });
      this.map.setPaintProperty(layer.id, 'raster-opacity', 0);
      setTimeout(() => {
        this.map.removeLayer(layer.id);
        this.map.removeSource(layer.source);
      }, LayerFadeTime);
    }
  };

  override componentDidMount(): void {
    // Force the URL to be read before loading the map
    Config.map.updateFromUrl();
    this.el = document.getElementById('map') as HTMLDivElement;

    if (this.el == null) throw new Error('Unable to find #map element');
    const cfg = Config.map;
    const tileGrid = getTileGrid(cfg.tileMatrix.identifier);
    const style = tileGrid.getStyle(cfg.layerId, cfg.style, cfg.config);
    const location = locationTransform(cfg.location, cfg.tileMatrix, GoogleTms);

    this.map = new maplibre.Map({
      container: this.el,
      style,
      maxPitch: LocationUrl.PitchMaxDegrees, // allow users to see more of the horizon, above 60 is experimental
      center: [location.lon, location.lat], // starting position [lon, lat]
      zoom: location.zoom, // starting zoom
      bearing: cfg.location.bearing ?? 0,
      pitch: cfg.location.pitch ?? 0,
      attributionControl: false,
    });

    this.mapAttr = new MapAttribution();
    this.map.addControl(this.mapAttr, 'bottom-right');

    if (Config.map.debug['debug.screenshot'] !== true) {
      const nav = new maplibre.NavigationControl({ visualizePitch: true });
      this.map.addControl(nav, 'top-left');
      if (!Config.map.isDebug) this.map.addControl(new maplibre.FullscreenControl({ container: this.el }));

      this.controlScale = new maplibre.ScaleControl({});
      this.map.addControl(this.controlScale, 'bottom-right');
    }

    this.map.on('render', this.onRender);
    this.map.on('idle', this.removeOldLayers);

    onMapLoaded(this.map, () => {
      this._events.push(
        Config.map.on('location', this.updateLocation),
        Config.map.on('tileMatrix', this.updateStyle),
        Config.map.on('layer', this.updateStyle),
        Config.map.on('bounds', this.updateBounds),
        // TODO: Disable updateVisibleLayers for now before we need implement date range slider
        // Config.map.on('visibleLayers', this.updateVisibleLayers),
      );
      this.map.on('terrain', this.updateTerrainFromEvent);

      this.updateStyle();
      // Need to ensure the debug layer has access to the map
      this.forceUpdate();
    });
  }

  _events: (() => boolean)[] = [];

  override componentWillUnmount(): void {
    if (this.map) this.map.remove();
    for (const unbind of this._events) unbind();
    this._events = [];
  }

  override render(): ReactNode {
    const isLayerSwitcherEnabled = Config.map.tileMatrix === GoogleTms && !Config.map.isDebug;
    return (
      <div style={{ flex: 1, position: 'relative' }}>
        <div id="map" style={{ width: '100%', height: '100%' }} />

        {this.map && Config.map.isDebug ? <Debug map={this.map} /> : undefined}
        {isLayerSwitcherEnabled ? <MapSwitcher /> : undefined}
      </div>
    );
  }

  updateUrlTimer: unknown = null;
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

    const path = LocationUrl.toSlug(location);
    const url = new URL(window.location.href);
    url.pathname = path;
    url.hash = ''; // Ensure the hash is removed, to ensure the redirect from #@location to /@location
    window.history.replaceState(null, '', url);
  }
}
