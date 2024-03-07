import { GoogleTms, LocationUrl } from '@basemaps/geo';
import maplibre, { RasterLayerSpecification } from 'maplibre-gl';
import { Component, ReactNode } from 'react';

import { MapAttribution } from '../attribution.js';
import { Config } from '../config.js';
import { getTileGrid, locationTransform } from '../tile.matrix.js';
import { MapOptionType, WindowUrl } from '../url.js';
import { DateRange } from './daterange.js';
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
  controlGeo?: maplibregl.GeolocateControl | null;
  controlTerrain?: maplibregl.TerrainControl | null;

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
    }
  }

  /**
   * Only enable terrain on debug mode
   */
  ensureTerrainControl(): void {
    if (Config.map.debug['debug.screenshot']) return;
    if (Config.map.debug) {
      const sources = Object.entries(this.map.getStyle().sources);
      const rasterDem = sources.find((e) => e[1].type === 'raster-dem');
      // const terrainSource = this.map.getSource('elevation-terrain');
      // console.log(this.map.getStyle().sources);
      if (this.controlTerrain != null) return;
      if (rasterDem != null) {
        this.controlTerrain = new maplibre.TerrainControl({
          source: rasterDem[0],
          exaggeration: 2.2,
        });
        this.map.addControl(this.controlTerrain, 'top-left');
      }
    } else {
      if (this.controlScale == null) return;
      this.map.removeControl(this.controlScale);
    }
  }

  /**
   * Load elevation terrain for the aerial map in debug mode
   */
  addElevationTerrain = (): void => {
    if (!Config.map.debug) return;
    if (Config.map.style === 'aerial' && this.map.getSource('elevation-terrain') == null) {
      // Add elevation into terrain for aerial map
      this.map.addSource('elevation-terrain', {
        type: 'raster-dem',
        tiles: [
          WindowUrl.toTileUrl({
            urlType: MapOptionType.TileRaster,
            tileMatrix: Config.map.tileMatrix,
            layerId: 'elevation',
            config: Config.map.config,
            pipeline: 'terrain-rgb',
            imageFormat: 'png',
          }),
        ],
        tileSize: 256,
      });
    }
  };

  updateStyle = (): void => {
    this.ensureGeoControl();
    this.ensureScaleControl();
    const tileGrid = getTileGrid(Config.map.tileMatrix.identifier);
    const style = tileGrid.getStyle(
      Config.map.layerId,
      Config.map.style,
      undefined,
      Config.map.filter.date,
      Config.map.pipeline,
    );
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
    if (Config.map.layerId !== 'aerial') return;
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
              pipeline: Config.map.pipeline,
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
    const style = tileGrid.getStyle(cfg.layerId, cfg.style, cfg.config, undefined, cfg.pipeline);
    const location = locationTransform(cfg.location, cfg.tileMatrix, GoogleTms);

    this.map = new maplibre.Map({
      container: this.el,
      style,
      center: [location.lon, location.lat], // starting position [lon, lat]
      zoom: location.zoom, // starting zoom
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
    this.map.on('sourcedata', this.addElevationTerrain);

    onMapLoaded(this.map, () => {
      this._events.push(
        Config.map.on('location', this.updateLocation),
        Config.map.on('tileMatrix', this.updateStyle),
        Config.map.on('layer', this.updateStyle),
        Config.map.on('bounds', this.updateBounds),
        Config.map.on('visibleLayers', this.updateVisibleLayers),
      );

      this.updateStyle();
      this.ensureTerrainControl();
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
        {this.map && Config.map.isDebug && !Config.map.debug['debug.screenshot'] && Config.map.debug['debug.date'] ? (
          <DateRange map={this.map} />
        ) : undefined}
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

    const path = LocationUrl.toSlug(location);
    const url = new URL(window.location.href);
    url.pathname = path;
    url.hash = ''; // Ensure the hash is removed, to ensure the redirect from #@location to /@location
    window.history.replaceState(null, '', url);
  }
}
